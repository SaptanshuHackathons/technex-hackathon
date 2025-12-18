from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
from collections import OrderedDict
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
    WidgetInitRequest,
    WidgetInitResponse,
    WidgetQueryRequest,
    WidgetQueryResponse,
    WidgetRefreshRequest,
    WidgetRefreshResponse,
    SummarizeRequest,
    SummarizeResponse

)
from config import WIDGET_API_KEY_PREFIX
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


class LRUCache(OrderedDict):
    """Thread-safe LRU cache with max size limit to prevent memory leaks."""

    def __init__(self, maxsize: int = 1000):
        super().__init__()
        self.maxsize = maxsize

    def __setitem__(self, key, value):
        if key in self:
            self.move_to_end(key)
        super().__setitem__(key, value)
        while len(self) > self.maxsize:
            oldest = next(iter(self))
            del self[oldest]

    def __getitem__(self, key):
        value = super().__getitem__(key)
        self.move_to_end(key)
        return value


# In-memory storage with LRU eviction to prevent memory leaks
scraped_pages_store: LRUCache = LRUCache(maxsize=1000)


async def scrape_stream_generator(request: ScrapeRequest):
    """
    Generator function to stream scraping progress events.

    Implements intelligent caching:
    - Checks if URL was previously scraped
    - Reuses existing data if found (unless force_refresh=True)
    - Creates new chat session for cached data
    - Only scrapes if no cache exists or force_refresh is requested
    """
    try:
        # Stage 1: Initialize
        yield f"data: {json.dumps({'stage': 'initializing', 'message': 'Starting scrape process...', 'progress': 0})}\n\n"

        # Check if URL was already scraped (unless force_refresh is True)
        existing_crawl = None
        if not request.force_refresh and not request.crawl_id:
            existing_crawl = db_service.find_crawl_by_url(request.url)

            if existing_crawl:
                crawl_id = existing_crawl["id"]
                yield f"data: {json.dumps({'stage': 'cache_found', 'message': 'Found existing data for this URL', 'progress': 5})}\n\n"

                # Get existing pages
                existing_pages = db_service.get_crawl_pages(crawl_id)

                if existing_pages and len(existing_pages) > 0:
                    # Create a new chat session for existing crawl
                    chat_id = db_service.create_chat(crawl_id)

                    yield f"data: {json.dumps({'stage': 'chat_created', 'message': 'Chat session created', 'chat_id': chat_id, 'crawl_id': crawl_id, 'progress': 15})}\n\n"

                    # Load existing data into memory
                    pages_data = []
                    for page in existing_pages:
                        page_data = {
                            "page_id": page["id"],
                            "url": page["url"],
                            "base_url": request.url,
                            "markdown": "",  # We don't store markdown in pages table
                            "crawl_id": crawl_id,
                            "metadata": page.get("metadata", {}),
                        }
                        pages_data.append(page_data)

                        # Store in memory
                        page_info = PageInfo(
                            page_id=page["id"],
                            url=page["url"],
                            base_url=request.url,
                            markdown="",
                            metadata=page.get("metadata", {}),
                            crawl_id=crawl_id,
                        )
                        scraped_pages_store[page["id"]] = page_info

                    yield f"data: {json.dumps({'stage': 'loaded', 'message': f'Loaded {len(pages_data)} pages from cache', 'progress': 50})}\n\n"

                    # Get existing summary if available
                    existing_chat_data = db_service.get_chat(chat_id)
                    if existing_chat_data and existing_chat_data.get("summary"):
                        summary_content = existing_chat_data["summary"]
                    else:
                        # Generate summary for cached data
                        yield f"data: {json.dumps({'stage': 'summarizing', 'message': 'Generating summary...', 'progress': 80})}\n\n"

                        from urllib.parse import urlparse

                        domain = urlparse(request.url).netloc

                        ai_summary = await rag_service.generate_content_summary(
                            pages_data=pages_data, domain=domain, max_pages_to_analyze=5
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
                        more_pages = (
                            f"\n...and {page_count - 10} more pages"
                            if page_count > 10
                            else ""
                        )

                        summary_content = (
                            f"**Using Cached Data**\n\n"
                            f"{ai_summary}\n\n"
                            f"**Indexed Pages:**\n\n"
                            f"{pages_list}{more_pages}"
                        )

                    # Store welcome message
                    db_service.store_message(chat_id, "ai", summary_content)

                    yield f"data: {json.dumps({'stage': 'complete', 'message': 'Loaded from cache!', 'chat_id': chat_id, 'crawl_id': crawl_id, 'page_count': len(pages_data), 'from_cache': True, 'progress': 100})}\n\n"
                    return

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

        # Stage 2: Scraping
        yield f"data: {json.dumps({'stage': 'scraping', 'message': 'Scraping website pages...', 'progress': 20})}\n\n"

        pages_data = await scraper_service.scrape_site(
            url=request.url, max_depth=request.max_depth, crawl_id=crawl_id
        )

        if not pages_data:
            yield f"data: {json.dumps({'stage': 'error', 'message': 'No pages were scraped'})}\n\n"
            return

        yield f"data: {json.dumps({'stage': 'scraped', 'message': f'Scraped {len(pages_data)} pages successfully', 'progress': 40})}\n\n"

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

        # Stage 4: Generating embeddings - Optimized with batching and parallelization - Optimized with batching and parallelization
        yield f"data: {json.dumps({'stage': 'embedding', 'message': 'Generating embeddings...', 'progress': 70})}\n\n"

        # Collect all chunks from all pages first
        all_page_chunks = []
        for page_data in pages_data:
            markdown = page_data.get("markdown", "")
            if markdown and len(markdown.strip()) > 0:
                try:
                    chunks = chunking_service.chunk_markdown(markdown)
                    if chunks:
                        all_page_chunks.append(
                            {
                                "page_data": page_data,
                                "chunks": chunks,
                                "markdown": markdown,
                            }
                        )
                except Exception as e:
                    print(f"Warning: Failed to chunk {page_data['url']}: {str(e)}")

            # Store page info
            page_info = PageInfo(
                page_id=page_data["page_id"],
                url=page_data["url"],
                base_url=page_data.get("base_url"),
                markdown=page_data.get("markdown", ""),
                metadata=page_data.get("metadata", {}),
                crawl_id=crawl_id,
            )
            scraped_pages_store[page_data["page_id"]] = page_info

        # Batch generate embeddings for ALL chunks at once (major optimization)
        total_chunks_stored = 0
        if all_page_chunks:
            # Flatten all chunk texts
            all_chunk_texts = []
            chunk_metadata = []  # Keep track of which chunk belongs to which page

            for page_chunk_data in all_page_chunks:
                page_data = page_chunk_data["page_data"]
                chunks = page_chunk_data["chunks"]

                for idx, chunk in enumerate(chunks):
                    all_chunk_texts.append(chunk["text"])
                    chunk_metadata.append(
                        {"page_data": page_data, "chunk": chunk, "idx": idx}
                    )

            # Generate ALL embeddings in one batch call
            try:
                all_embeddings = await embedding_service.generate_embeddings(
                    all_chunk_texts
                )

                # Prepare all data for batch storage
                embeddings_batch = []
                for embedding, meta in zip(all_embeddings, chunk_metadata):
                    chunk_id = f"{meta['page_data']['page_id']}_chunk_{meta['idx']}"
                    embeddings_batch.append(
                        {
                            "page_id": chunk_id,
                            "url": meta["page_data"]["url"],
                            "markdown": meta["chunk"]["text"],
                            "embedding": embedding,
                            "metadata": {
                                **meta["page_data"].get("metadata", {}),
                                "chunk_index": meta["chunk"]["chunk_index"],
                                "total_chunks": meta["chunk"]["total_chunks"],
                                "original_page_id": meta["page_data"]["page_id"],
                            },
                            "crawl_id": crawl_id,
                            "base_url": meta["page_data"].get("base_url"),
                        }
                    )

                # Store all embeddings using batch operation - much faster!
                batch_size = 100  # Qdrant can handle large batches efficiently
                for i in range(0, len(embeddings_batch), batch_size):
                    batch = embeddings_batch[i : i + batch_size]
                    await vector_store_service.store_embeddings_batch(batch)
                    total_chunks_stored += len(batch)

            except Exception as e:
                print(f"Warning: Failed to generate/store embeddings: {str(e)}")
                import traceback

                traceback.print_exc()

        yield f"data: {json.dumps({'stage': 'embedded', 'message': f'Generated embeddings for {total_chunks_stored} chunks', 'progress': 80})}\n\n"

        # Update crawl page count
        db_service.update_crawl_page_count(crawl_id, len(pages_data))

        # Stage 5: Generating summary
        yield f"data: {json.dumps({'stage': 'summarizing', 'message': 'Generating AI summary...', 'progress': 90})}\n\n"

        from urllib.parse import urlparse

        domain = urlparse(request.url).netloc

        ai_summary = await rag_service.generate_content_summary(
            pages_data=pages_data, domain=domain, max_pages_to_analyze=5
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
        yield f"data: {json.dumps({'stage': 'complete', 'message': 'Scraping completed successfully!', 'chat_id': chat_id, 'crawl_id': crawl_id, 'page_count': len(pages_data), 'from_cache': False, 'progress': 100})}\n\n"

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
        },
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

        # Generate embeddings and store in vector database using batch processing
        total_chunks_stored = 0
        
        # Collect all chunks from all pages first for batch processing
        all_page_chunks = []
        for page_data in pages_data:
            markdown = page_data.get("markdown", "")
            if markdown and len(markdown.strip()) > 0:
                try:
                    chunks = chunking_service.chunk_markdown(markdown)
                    if chunks:
                        all_page_chunks.append({
                            "page_data": page_data,
                            "chunks": chunks,
                            "markdown": markdown
                        })
                except Exception as e:
                    print(f"Warning: Failed to chunk {page_data['url']}: {str(e)}")
            
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
        
        # Batch generate embeddings for ALL chunks at once
        if all_page_chunks:
            # Flatten all chunk texts
            all_chunk_texts = []
            chunk_metadata = []
            
            for page_chunk_data in all_page_chunks:
                page_data = page_chunk_data["page_data"]
                chunks = page_chunk_data["chunks"]
                
                for idx, chunk in enumerate(chunks):
                    all_chunk_texts.append(chunk["text"])
                    chunk_metadata.append({
                        "page_data": page_data,
                        "chunk": chunk,
                        "idx": idx
                    })
            
            # Generate ALL embeddings in one batch call
            try:
                all_embeddings = await embedding_service.generate_embeddings(all_chunk_texts)
                
                # Prepare all data for batch storage
                embeddings_batch = []
                for embedding, meta in zip(all_embeddings, chunk_metadata):
                    chunk_id = f"{meta['page_data']['page_id']}_chunk_{meta['idx']}"
                    embeddings_batch.append({
                        "page_id": chunk_id,
                        "url": meta["page_data"]["url"],
                        "markdown": meta["chunk"]["text"],
                        "embedding": embedding,
                        "metadata": {
                            **meta["page_data"].get("metadata", {}),
                            "chunk_index": meta["chunk"]["chunk_index"],
                            "total_chunks": meta["chunk"]["total_chunks"],
                            "original_page_id": meta["page_data"]["page_id"],
                        },
                        "crawl_id": crawl_id,
                        "base_url": meta["page_data"].get("base_url"),
                    })
                
                # Store all embeddings using batch operation
                batch_size = 100
                for i in range(0, len(embeddings_batch), batch_size):
                    batch = embeddings_batch[i:i+batch_size]
                    await vector_store_service.store_embeddings_batch(batch)
                    total_chunks_stored += len(batch)
                    
            except Exception as e:
                print(f"Warning: Failed to generate/store embeddings: {str(e)}")
                import traceback
                traceback.print_exc()

        # Update crawl page count in database
        db_service.update_crawl_page_count(crawl_id, len(pages_data))

        # Generate AI-powered summary using Gemini
        from urllib.parse import urlparse

        domain = urlparse(request.url).netloc

        # Generate content summary using RAG service
        ai_summary = await rag_service.generate_content_summary(
            pages_data=pages_data, domain=domain, max_pages_to_analyze=5
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
    Optimized to batch fetch crawl data to avoid N+1 queries.
    """
    chats = db_service.list_chats()
    
    if not chats:
        return []

    # Batch fetch all unique crawl_ids in one query
    crawl_ids = list(set(chat.get("crawl_id") for chat in chats if chat.get("crawl_id")))
    
    # Create a map of crawl_id -> crawl data
    crawls_map = {}
    root_titles_map = {}
    
    for crawl_id in crawl_ids:
        crawl = db_service.get_crawl(crawl_id)
        if crawl:
            crawls_map[crawl_id] = crawl
            # Get root page title
            pages = db_service.get_crawl_tree(crawl_id)
            if pages and len(pages) > 0:
                root_titles_map[crawl_id] = pages[0].get("title")

    # Enrich chats with cached crawl data
    enriched_chats = []
    for chat in chats:
        crawl_id = chat.get("crawl_id")
        crawl = crawls_map.get(crawl_id)
        root_title = root_titles_map.get(crawl_id)

        chat_data = {
            **chat,
            "url": crawl.get("url") if crawl else None,
            "title": root_title,
            "page_count": crawl.get("page_count", 0) if crawl else 0,
        }
        enriched_chats.append(chat_data)

    return enriched_chats


@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    """
    Delete a chat session and all its messages.
    """
    chat = db_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail=f"Chat ID '{chat_id}' not found")

    success = db_service.delete_chat(chat_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete chat")

    return {"success": True, "message": "Chat deleted successfully"}


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
    Saves both user query and assistant response to Supabase.
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

        # Save user message to database
        db_service.add_message(
            chat_id=request.chat_id,
            role="user",
            content=request.query
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

        # Save assistant message to database with sources
        db_service.add_message(
            chat_id=request.chat_id,
            role="assistant",
            content=rag_response["answer"],
            metadata={
                "sources": [{"url": s.url, "title": s.title, "score": s.score} for s in sources],
                **rag_response["metadata"]
            }
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


# ============== Widget API Endpoints ==============

def _validate_widget_api_key(api_key: str) -> bool:
    """Simple API key validation - checks prefix for now."""
    return api_key.startswith(WIDGET_API_KEY_PREFIX)


@router.post("/widget/init", response_model=WidgetInitResponse)
async def widget_init(request: WidgetInitRequest):
    """
    Initialize widget for a site. Checks if embeddings exist.
    Does NOT create embeddings if they don't exist - that requires explicit refresh.
    """
    try:
        # Validate API key
        if not _validate_widget_api_key(request.api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")

        # Check if embeddings exist for this site_id
        has_embeddings, count = await vector_store_service.widget_has_embeddings(
            request.site_id
        )

        if has_embeddings:
            return WidgetInitResponse(
                success=True,
                site_id=request.site_id,
                has_embeddings=True,
                indexed_page_count=count,
                message=f"Site initialized. {count} embeddings found.",
            )
        else:
            return WidgetInitResponse(
                success=True,
                site_id=request.site_id,
                has_embeddings=False,
                indexed_page_count=0,
                message="No embeddings found. Call /widget/refresh to create embeddings.",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Widget init failed: {str(e)}")


@router.post("/widget/refresh", response_model=WidgetRefreshResponse)
async def widget_refresh(request: WidgetRefreshRequest):
    """
    Refresh embeddings for a widget site. 
    Scrapes all pages and regenerates embeddings.
    Only call this when developer explicitly wants to update.
    """
    try:
        # Validate API key
        if not _validate_widget_api_key(request.api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")

        if not request.pages:
            raise HTTPException(status_code=400, detail="No pages provided")

        # Delete existing embeddings for this site
        await vector_store_service.widget_delete_site_embeddings(request.site_id)

        # Scrape and process each page
        all_embeddings_data = []
        
        for page in request.pages:
            try:
                # Scrape the page
                scraped_data = await scraper_service.scrape_page(page.url)
                if not scraped_data or not scraped_data.get("markdown"):
                    continue

                markdown = scraped_data.get("markdown", "")
                metadata = scraped_data.get("metadata", {})
                
                # Chunk the content
                chunks = chunking_service.chunk_text(
                    markdown,
                    metadata={
                        "url": page.url,
                        "title": metadata.get("title", page.label or ""),
                        "label": page.label or "",
                    },
                )

                # Generate embeddings for chunks
                chunk_texts = [c["text"] for c in chunks]
                embeddings = await embedding_service.generate_embeddings_batch(chunk_texts)

                # Prepare data for storage
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    page_id = f"{request.site_id}:{page.url}:chunk_{i}"
                    all_embeddings_data.append({
                        "page_id": page_id,
                        "url": page.url,
                        "markdown": chunk["text"],
                        "embedding": embedding,
                        "label": page.label or "",
                        "metadata": {
                            "title": metadata.get("title", ""),
                            "chunk_index": i,
                            "total_chunks": len(chunks),
                        },
                    })

            except Exception as page_error:
                print(f"Error processing page {page.url}: {str(page_error)}")
                continue

        # Store all embeddings
        if all_embeddings_data:
            await vector_store_service.widget_store_embeddings_batch(
                request.site_id, all_embeddings_data
            )

        return WidgetRefreshResponse(
            success=True,
            site_id=request.site_id,
            indexed_page_count=len(all_embeddings_data),
            message=f"Successfully indexed {len(all_embeddings_data)} chunks from {len(request.pages)} pages.",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Widget refresh failed: {str(e)}")


@router.post("/widget/query", response_model=WidgetQueryResponse)
async def widget_query(request: WidgetQueryRequest):
    """
    Query the widget's indexed content.
    Uses embeddings from the site_id namespace.
    """
    try:
        # Validate API key
        if not _validate_widget_api_key(request.api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")

        # Check if embeddings exist
        has_embeddings, _ = await vector_store_service.widget_has_embeddings(
            request.site_id
        )
        
        if not has_embeddings:
            raise HTTPException(
                status_code=404,
                detail="No embeddings found for this site. Call /widget/refresh first.",
            )

        # Generate query embedding
        query_embedding = await embedding_service.generate_query_embedding(
            request.query
        )

        # Search for similar documents
        similar_docs = await vector_store_service.widget_search_similar(
            query_embedding=query_embedding,
            site_id=request.site_id,
            limit=max(request.limit, 10),
        )

        if not similar_docs:
            raise HTTPException(
                status_code=404,
                detail="No relevant documents found.",
            )

        # Generate RAG response
        rag_response = await rag_service.generate_response(
            query=request.query, context_documents=similar_docs
        )

        # Convert sources
        sources = [
            Source(
                url=doc["url"],
                title=doc.get("title") or doc.get("label", ""),
                score=doc.get("score", 0.0),
            )
            for doc in rag_response["sources"]
        ]

        return WidgetQueryResponse(
            answer=rag_response["answer"],
            sources=sources,
            site_id=request.site_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Widget query failed: {str(e)}")
@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_page(request: SummarizeRequest):
    """
    Generate a concise bullet-point summary of the scraped page content.
    Returns a well-formatted summary with key points.
    """
    try:
        # Get crawl_id from chat_id
        crawl_id = db_service.get_crawl_id_from_chat_id(request.chat_id)
        
        if not crawl_id:
            raise HTTPException(
                status_code=404,
                detail=f"Chat ID '{request.chat_id}' not found. Please create a chat session first."
            )
        
        # Get all relevant documents for this crawl (no query embedding needed)
        # We'll use a dummy embedding and high limit to get all content
        # Better approach: retrieve all chunks for the crawl_id directly
        from config import EMBEDDING_DIMENSION
        dummy_embedding = [0.0] * EMBEDDING_DIMENSION
        
        # Get more chunks for comprehensive summary
        all_docs = await vector_store_service.search_similar(
            query_embedding=dummy_embedding,
            crawl_id=crawl_id,
            limit=50,  # Get more content for summary
            score_threshold=0.0  # No filtering, get all content
        )
        
        if not all_docs:
            raise HTTPException(
                status_code=404,
                detail=f"No content found for chat '{request.chat_id}'. Please scrape a website first."
            )
        
        # Combine all document content
        combined_content = "\n\n".join([
            f"Section {i+1}:\n{doc.get('markdown', '')}" 
            for i, doc in enumerate(all_docs[:20])  # Limit to avoid token limits
        ])
        
        # Create structured prompt for bullet-point summary
        summary_prompt = f"""You are a professional content summarizer. Your task is to create a concise, well-structured summary of the following webpage content.

**CRITICAL FORMATTING RULES:**
1. Each bullet point MUST be on a NEW LINE
2. Add a BLANK LINE after each bullet point for spacing
3. Start each point with • or -
4. Each point should be 1-2 lines maximum
5. Include 5-8 bullet points total
6. Use clear, simple language

**Content to Summarize:**
{combined_content[:8000]}

**REQUIRED OUTPUT FORMAT (FOLLOW EXACTLY):**
You MUST format your response EXACTLY like this example:

• First key point about the main topic

• Second important point with relevant details

• Third point highlighting another aspect

• Fourth point with additional information

IMPORTANT: Put each bullet on its own line with a blank line after it. Do NOT put multiple bullets on the same line.

Now provide the summary following this exact format:"""
        
        # Generate summary using RAG service's LLM
        from langchain_core.messages import HumanMessage
        response = await rag_service.llm.ainvoke([HumanMessage(content=summary_prompt)])
        
        summary_text = response.content.strip()
        
        return SummarizeResponse(
            summary=summary_text,
            chat_id=request.chat_id,
            crawl_id=crawl_id,
            metadata={
                "model": "gemini-pro-latest",
                "chunks_used": len(all_docs),
                "content_length": len(combined_content)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Summarization failed: {str(e)}"
        )


@router.get("/chats/{chat_id}/history")
async def get_chat_history(chat_id: str, limit: Optional[int] = None):
    """
    Get chat message history by chat_id.
    Returns messages ordered by creation time.
    """
    try:
        # Verify chat exists
        chat = db_service.get_chat(chat_id)
        if not chat:
            raise HTTPException(
                status_code=404,
                detail=f"Chat ID '{chat_id}' not found"
            )
        
        messages = db_service.get_messages(chat_id, limit)
        return {
            "chat_id": chat_id,
            "messages": messages,
            "count": len(messages)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve chat history: {str(e)}"
        )


