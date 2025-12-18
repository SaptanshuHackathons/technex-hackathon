from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List
import uuid
import json
import asyncio
from models import (
    ScrapeRequest,
    ScrapeResponse,
    PageInfo,
    QueryRequest,
    QueryResponse,
    Source,
    CreateChatRequest,
)
from services.scraper import ScraperService
from services.embeddings import EmbeddingService
from services.vector_store import VectorStoreService
from services.rag import RAGService
from services.database import DatabaseService
from services.chunking import ChunkingService

router = APIRouter()

# Initialize services
scraper_service = ScraperService()
embedding_service = EmbeddingService()
vector_store_service = VectorStoreService()
rag_service = RAGService()
db_service = DatabaseService()
chunking_service = ChunkingService(chunk_size=800, chunk_overlap=200)

# In-memory storage for scraped pages (you might want to use a database)
scraped_pages_store: dict[str, PageInfo] = {}


async def scrape_stream_generator(request: ScrapeRequest):
    """Generator function to stream scraping progress events"""
    try:
        # Stage 1: Initialize
        yield f"data: {json.dumps({'stage': 'initializing', 'message': 'Starting scrape process...', 'progress': 0})}\n\n"
        await asyncio.sleep(0.5)
        
        # Generate or use provided crawl_id
        if request.crawl_id:
            crawl_id = request.crawl_id
            if not db_service.get_crawl(crawl_id):
                db_service.create_crawl(request.url, crawl_id)
        else:
            crawl_id = db_service.create_crawl(request.url)

        # Create chat session immediately
        chat_id = db_service.create_chat(crawl_id)
        
        yield f"data: {json.dumps({'stage': 'chat_created', 'message': 'Chat session created', 'chat_id': chat_id, 'crawl_id': crawl_id, 'progress': 10})}\n\n"
        await asyncio.sleep(0.3)

        # Stage 2: Scraping
        yield f"data: {json.dumps({'stage': 'scraping', 'message': 'Scraping website pages...', 'progress': 20})}\n\n"
        
        pages_data = await scraper_service.scrape_site(
            url=request.url, max_depth=request.max_depth, crawl_id=crawl_id
        )

        if not pages_data:
            yield f"data: {json.dumps({'stage': 'error', 'message': 'No pages were scraped'})}\n\n"
            return

        yield f"data: {json.dumps({'stage': 'scraped', 'message': f'Scraped {len(pages_data)} pages successfully', 'progress': 40})}\n\n"
        await asyncio.sleep(0.3)

        # Stage 3: Storing pages
        yield f"data: {json.dumps({'stage': 'storing', 'message': 'Storing page data...', 'progress': 50})}\n\n"
        
        parent_url = None
        for idx, page_data in enumerate(pages_data):
            page_url = page_data["url"]
            title = page_data.get("metadata", {}).get("title", page_url)

            db_service.store_page(
                crawl_id=crawl_id,
                url=page_url,
                title=title,
                parent_url=parent_url if idx > 0 else None,
                metadata=page_data.get("metadata", {}),
            )

            if idx == 0:
                parent_url = page_url

        yield f"data: {json.dumps({'stage': 'stored', 'message': 'Pages stored successfully', 'progress': 60})}\n\n"
        await asyncio.sleep(0.3)

        # Stage 4: Generating embeddings
        yield f"data: {json.dumps({'stage': 'embedding', 'message': 'Generating embeddings...', 'progress': 70})}\n\n"
        
        total_chunks_stored = 0
        for page_data in pages_data:
            markdown = page_data.get("markdown", "")
            if markdown and len(markdown.strip()) > 0:
                try:
                    chunks = chunking_service.chunk_markdown(markdown)
                    if not chunks:
                        continue

                    chunk_texts = [chunk["text"] for chunk in chunks]
                    embeddings = await embedding_service.generate_embeddings(chunk_texts)

                    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                        chunk_id = f"{page_data['page_id']}_chunk_{idx}"
                        await vector_store_service.store_embeddings(
                            page_id=chunk_id,
                            url=page_data["url"],
                            markdown=chunk["text"],
                            embedding=embedding,
                            metadata={
                                **page_data.get("metadata", {}),
                                "chunk_index": chunk["chunk_index"],
                                "total_chunks": chunk["total_chunks"],
                                "original_page_id": page_data["page_id"],
                            },
                            crawl_id=crawl_id,
                            base_url=page_data.get("base_url"),
                        )
                        total_chunks_stored += 1

                except Exception as e:
                    print(f"Warning: Failed to generate/store embeddings for {page_data['url']}: {str(e)}")
                    import traceback
                    traceback.print_exc()

            page_info = PageInfo(
                page_id=page_data["page_id"],
                url=page_data["url"],
                base_url=page_data.get("base_url"),
                markdown=markdown,
                metadata=page_data.get("metadata", {}),
                crawl_id=crawl_id,
            )
            scraped_pages_store[page_data["page_id"]] = page_info

        yield f"data: {json.dumps({'stage': 'embedded', 'message': f'Generated embeddings for {total_chunks_stored} chunks', 'progress': 80})}\n\n"
        await asyncio.sleep(0.3)

        # Update crawl page count
        db_service.update_crawl_page_count(crawl_id, len(pages_data))

        # Stage 5: Generating summary
        yield f"data: {json.dumps({'stage': 'summarizing', 'message': 'Generating AI summary...', 'progress': 90})}\n\n"
        
        from urllib.parse import urlparse
        domain = urlparse(request.url).netloc
        
        ai_summary = await rag_service.generate_content_summary(
            pages_data=pages_data,
            domain=domain,
            max_pages_to_analyze=5
        )
        
        page_count = len(pages_data)
        summary = f"Indexed {page_count} page{'s' if page_count > 1 else ''} from {request.url}"
        db_service.update_chat_summary(chat_id, summary)

        pages_list = "\n".join(
            [
                f"{idx + 1}. {p.get('metadata', {}).get('title', 'Untitled Page')}"
                for idx, p in enumerate(pages_data[:10])
            ]
        )
        more_pages = f"\n...and {page_count - 10} more pages" if page_count > 10 else ""

        summary_content = (
            f"**Indexing Complete**\n\n"
            f"{ai_summary}\n\n"
            f"**Indexed Pages:**\n\n"
            f"{pages_list}{more_pages}"
        )
        db_service.store_message(chat_id, "ai", summary_content)

        # Stage 6: Complete
        yield f"data: {json.dumps({'stage': 'complete', 'message': 'Scraping completed successfully!', 'chat_id': chat_id, 'crawl_id': crawl_id, 'page_count': len(pages_data), 'progress': 100})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'stage': 'error', 'message': f'Scraping failed: {str(e)}'})}\n\n"


@router.post("/scrape/stream")
async def scrape_website_stream(request: ScrapeRequest):
    """
    Scrape a website with streaming progress updates via Server-Sent Events (SSE).
    """
    return StreamingResponse(
        scrape_stream_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_website(request: ScrapeRequest):
    """
    Scrape a website, generate embeddings, and create a chat session.
    Returns scraped pages, crawl_id, and chat_id.
    """
    try:
        # Generate or use provided crawl_id
        if request.crawl_id:
            crawl_id = request.crawl_id
            # Create crawl entry if it doesn't exist
            if not db_service.get_crawl(crawl_id):
                db_service.create_crawl(request.url, crawl_id)
        else:
            crawl_id = db_service.create_crawl(request.url)

        # Create chat session immediately
        chat_id = db_service.create_chat(crawl_id)

        # Scrape the website
        pages_data = await scraper_service.scrape_site(
            url=request.url, max_depth=request.max_depth, crawl_id=crawl_id
        )

        if not pages_data:
            raise HTTPException(
                status_code=404,
                detail="No pages were scraped. Please check the URL and try again.",
            )

        # Store pages in Supabase with hierarchy
        # First page is the root, others are children of the first (simplified for now)
        parent_url = None
        for idx, page_data in enumerate(pages_data):
            page_url = page_data["url"]
            title = page_data.get("metadata", {}).get("title", page_url)

            # Store in Supabase
            db_service.store_page(
                crawl_id=crawl_id,
                url=page_url,
                title=title,
                parent_url=parent_url if idx > 0 else None,
                metadata=page_data.get("metadata", {}),
            )

            # First page becomes the parent for subsequent pages (simplified hierarchy)
            if idx == 0:
                parent_url = page_url

        # Generate embeddings and store in vector database
        total_chunks_stored = 0
        for page_data in pages_data:
            # Get markdown content
            markdown = page_data.get("markdown", "")
            if markdown and len(markdown.strip()) > 0:
                try:
                    # Chunk the markdown content
                    chunks = chunking_service.chunk_markdown(markdown)

                    if not chunks:
                        continue

                    # Generate embeddings for all chunks
                    chunk_texts = [chunk["text"] for chunk in chunks]
                    embeddings = await embedding_service.generate_embeddings(
                        chunk_texts
                    )

                    # Store each chunk as a separate vector
                    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                        chunk_id = f"{page_data['page_id']}_chunk_{idx}"
                        await vector_store_service.store_embeddings(
                            page_id=chunk_id,
                            url=page_data["url"],
                            markdown=chunk["text"],  # Store chunk text, not full page
                            embedding=embedding,
                            metadata={
                                **page_data.get("metadata", {}),
                                "chunk_index": chunk["chunk_index"],
                                "total_chunks": chunk["total_chunks"],
                                "original_page_id": page_data["page_id"],
                            },
                            crawl_id=crawl_id,
                            base_url=page_data.get("base_url"),
                        )
                        total_chunks_stored += 1

                except Exception as e:
                    print(
                        f"Warning: Failed to generate/store embeddings for {page_data['url']}: {str(e)}"
                    )
                    import traceback

                    traceback.print_exc()

            # Store page info in memory (for backward compatibility)
            page_info = PageInfo(
                page_id=page_data["page_id"],
                url=page_data["url"],
                base_url=page_data.get("base_url"),
                markdown=markdown,
                metadata=page_data.get("metadata", {}),
                crawl_id=crawl_id,
            )
            scraped_pages_store[page_data["page_id"]] = page_info

        # Update crawl page count in database
        db_service.update_crawl_page_count(crawl_id, len(pages_data))

        # Generate AI-powered summary using Gemini
        from urllib.parse import urlparse
        domain = urlparse(request.url).netloc
        
        # Generate content summary using RAG service
        ai_summary = await rag_service.generate_content_summary(
            pages_data=pages_data,
            domain=domain,
            max_pages_to_analyze=5
        )
        
        # Store short summary for chat metadata
        page_count = len(pages_data)
        summary = f"Indexed {page_count} page{'s' if page_count > 1 else ''} from {request.url}"
        db_service.update_chat_summary(chat_id, summary)

        # Get page titles list
        pages_list = "\n".join(
            [
                f"{idx + 1}. {p.get('metadata', {}).get('title', 'Untitled Page')}"
                for idx, p in enumerate(pages_data[:10])
            ]
        )
        more_pages = f"\n...and {page_count - 10} more pages" if page_count > 10 else ""

        # Combine AI summary with page list
        summary_content = (
            f"**Indexing Complete**\n\n"
            f"{ai_summary}\n\n"
            f"**Indexed Pages:**\n\n"
            f"{pages_list}{more_pages}"
        )
        db_service.store_message(chat_id, "ai", summary_content)

        # Convert to response model - get pages that were just scraped
        scraped_page_ids = {p["page_id"] for p in pages_data}
        pages = [
            scraped_pages_store[pid]
            for pid in scraped_page_ids
            if pid in scraped_pages_store
        ]

        return ScrapeResponse(
            success=True,
            pages=pages,
            crawl_id=crawl_id,
            chat_id=chat_id,
            message=f"Successfully scraped {len(pages)} pages and created chat session",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")


@router.get("/pages", response_model=List[PageInfo])
async def get_scraped_pages():
    """
    Get all scraped pages with their IDs.
    """
    return list(scraped_pages_store.values())


@router.get("/pages/{page_id}", response_model=PageInfo)
async def get_page(page_id: str):
    """
    Get a specific scraped page by ID.
    """
    if page_id not in scraped_pages_store:
        raise HTTPException(status_code=404, detail=f"Page with ID {page_id} not found")

    return scraped_pages_store[page_id]


@router.post("/chats")
async def create_chat(request: CreateChatRequest):
    """
    Create a new chat session linked to a crawl.
    Returns the chat_id.
    """
    try:
        # Verify crawl exists
        crawl = db_service.get_crawl(request.crawl_id)
        if not crawl:
            raise HTTPException(
                status_code=404, detail=f"Crawl ID '{request.crawl_id}' not found"
            )

        chat_id = db_service.create_chat(request.crawl_id)
        return {
            "chat_id": chat_id,
            "crawl_id": request.crawl_id,
            "message": "Chat session created successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")


@router.get("/chats/{chat_id}")
async def get_chat(chat_id: str):
    """
    Get chat metadata by chat_id.
    """
    chat = db_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail=f"Chat ID '{chat_id}' not found")
    return chat


@router.get("/chats")
async def list_chats():
    """
    List all chat sessions with enriched metadata.
    """
    chats = db_service.list_chats()

    # Enrich with crawl URL and root page title for better display names
    enriched_chats = []
    for chat in chats:
        crawl = db_service.get_crawl(chat.get("crawl_id"))

        # Get the root page title for a better chat name
        root_title = None
        if crawl:
            pages = db_service.get_crawl_tree(chat.get("crawl_id"))
            if pages and len(pages) > 0:
                root_title = pages[0].get("title")

        chat_data = {
            **chat,
            "url": crawl.get("url") if crawl else None,
            "title": root_title,
            "page_count": crawl.get("page_count", 0) if crawl else 0,
        }
        enriched_chats.append(chat_data)

    return enriched_chats


@router.get("/crawls")
async def list_crawls():
    """
    List all crawl sessions.
    """
    return db_service.list_crawls()


@router.get("/crawls/{crawl_id}")
async def get_crawl(crawl_id: str):
    """
    Get crawl metadata by crawl_id.
    """
    crawl = db_service.get_crawl(crawl_id)
    if not crawl:
        raise HTTPException(status_code=404, detail=f"Crawl ID '{crawl_id}' not found")
    return crawl


@router.get("/crawls/{crawl_id}/tree")
async def get_crawl_tree(crawl_id: str):
    """
    Get hierarchical page tree for a crawl.
    Returns pages in a nested structure for sidebar display.
    """
    crawl = db_service.get_crawl(crawl_id)
    if not crawl:
        raise HTTPException(status_code=404, detail=f"Crawl ID '{crawl_id}' not found")

    tree = db_service.get_crawl_tree(crawl_id)
    return {"crawl_id": crawl_id, "tree": tree}


@router.get("/chats/{chat_id}/tree")
async def get_chat_tree(chat_id: str):
    """
    Get hierarchical page tree for a chat session.
    Returns pages in a nested structure for sidebar display.
    """
    crawl_id = db_service.get_crawl_id_from_chat_id(chat_id)
    if not crawl_id:
        raise HTTPException(status_code=404, detail=f"Chat ID '{chat_id}' not found")

    tree = db_service.get_crawl_tree(crawl_id)
    return {"chat_id": chat_id, "crawl_id": crawl_id, "tree": tree}


@router.get("/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str):
    """
    Get all messages for a chat session.
    """
    chat = db_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail=f"Chat ID '{chat_id}' not found")

    messages = db_service.get_chat_messages(chat_id)
    print(f"Retrieved {len(messages)} messages for chat {chat_id}")
    for msg in messages:
        print(
            f"Message {msg.get('id')}: role={msg.get('role')}, has sources: {bool(msg.get('sources'))}, sources count: {len(msg.get('sources', []))}"
        )
    return {"chat_id": chat_id, "messages": messages}


@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the RAG system with a user question.
    Returns an answer with sources, filtered by chat_id (which maps to a crawl_id).
    """
    try:
        # Get crawl_id from chat_id
        crawl_id = db_service.get_crawl_id_from_chat_id(request.chat_id)

        if not crawl_id:
            # If chat_id doesn't exist, create a new chat (but this shouldn't happen in normal flow)
            # For now, raise an error - the frontend should create a chat first
            raise HTTPException(
                status_code=404,
                detail=f"Chat ID '{request.chat_id}' not found. Please create a chat session first.",
            )

        # Generate embedding for the query
        query_embedding = await embedding_service.generate_query_embedding(
            request.query
        )

        # Search for similar documents (filtered by crawl_id)
        # Increase limit to get more relevant chunks
        search_limit = max(
            request.limit, 10
        )  # Get at least 10 chunks for better context
        similar_docs = await vector_store_service.search_similar(
            query_embedding=query_embedding, crawl_id=crawl_id, limit=search_limit
        )

        if not similar_docs:
            raise HTTPException(
                status_code=404,
                detail=f"No relevant documents found for chat '{request.chat_id}'. Please scrape a website first.",
            )

        # Generate RAG response
        rag_response = await rag_service.generate_response(
            query=request.query, context_documents=similar_docs
        )

        # Convert sources to response model
        sources = [
            Source(
                url=doc["url"], title=doc.get("title", ""), score=doc.get("score", 0.0)
            )
            for doc in rag_response["sources"]
        ]

        # Store user message and AI response
        db_service.store_message(request.chat_id, "user", request.query)

        # Convert sources to dict for storage
        sources_dict = [
            {"url": s.url, "title": s.title, "score": s.score} for s in sources
        ]

        db_service.store_message(
            request.chat_id, "ai", rag_response["answer"], sources=sources_dict
        )

        return QueryResponse(
            answer=rag_response["answer"],
            sources=sources,
            chat_id=request.chat_id,
            crawl_id=crawl_id,
            metadata=rag_response["metadata"],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
