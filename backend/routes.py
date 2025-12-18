from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from models import ScrapeRequest, ScrapeResponse, PageInfo, QueryRequest, QueryResponse, Source, CreateChatRequest
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


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_website(request: ScrapeRequest):
    """
    Scrape a website and generate embeddings.
    Returns scraped pages with unique IDs and a crawl_id.
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
        
        # Scrape the website
        pages_data = await scraper_service.scrape_site(
            url=request.url,
            max_depth=request.max_depth,
            crawl_id=crawl_id
        )
        
        if not pages_data:
            raise HTTPException(
                status_code=404,
                detail="No pages were scraped. Please check the URL and try again."
            )
        
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
                    embeddings = await embedding_service.generate_embeddings(chunk_texts)
                    
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
                                "original_page_id": page_data["page_id"]
                            },
                            crawl_id=crawl_id,
                            base_url=page_data.get("base_url")
                        )
                        total_chunks_stored += 1
                    
                except Exception as e:
                    print(f"Warning: Failed to generate/store embeddings for {page_data['url']}: {str(e)}")
                    import traceback
                    traceback.print_exc()
            
            # Store page info in memory
            page_info = PageInfo(
                page_id=page_data["page_id"],
                url=page_data["url"],
                base_url=page_data.get("base_url"),
                markdown=markdown,
                metadata=page_data.get("metadata", {}),
                crawl_id=crawl_id
            )
            scraped_pages_store[page_data["page_id"]] = page_info
        
        # Update crawl page count in database
        db_service.update_crawl_page_count(crawl_id, len(pages_data))
        
        # Convert to response model - get pages that were just scraped
        scraped_page_ids = {p["page_id"] for p in pages_data}
        pages = [scraped_pages_store[pid] for pid in scraped_page_ids if pid in scraped_pages_store]
        
        return ScrapeResponse(
            success=True,
            pages=pages,
            crawl_id=crawl_id,
            message=f"Successfully scraped {len(pages)} pages"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scraping failed: {str(e)}"
        )


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
        raise HTTPException(
            status_code=404,
            detail=f"Page with ID {page_id} not found"
        )
    
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
                status_code=404,
                detail=f"Crawl ID '{request.crawl_id}' not found"
            )
        
        chat_id = db_service.create_chat(request.crawl_id)
        return {
            "chat_id": chat_id,
            "crawl_id": request.crawl_id,
            "message": "Chat session created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create chat: {str(e)}"
        )


@router.get("/chats/{chat_id}")
async def get_chat(chat_id: str):
    """
    Get chat metadata by chat_id.
    """
    chat = db_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(
            status_code=404,
            detail=f"Chat ID '{chat_id}' not found"
        )
    return chat


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
        raise HTTPException(
            status_code=404,
            detail=f"Crawl ID '{crawl_id}' not found"
        )
    return crawl


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
                detail=f"Chat ID '{request.chat_id}' not found. Please create a chat session first."
            )
        
        # Generate embedding for the query
        query_embedding = await embedding_service.generate_query_embedding(request.query)
        
        # Search for similar documents (filtered by crawl_id)
        # Increase limit to get more relevant chunks
        search_limit = max(request.limit, 10)  # Get at least 10 chunks for better context
        similar_docs = await vector_store_service.search_similar(
            query_embedding=query_embedding,
            crawl_id=crawl_id,
            limit=search_limit
        )
        
        if not similar_docs:
            raise HTTPException(
                status_code=404,
                detail=f"No relevant documents found for chat '{request.chat_id}'. Please scrape a website first."
            )
        
        # Generate RAG response
        rag_response = await rag_service.generate_response(
            query=request.query,
            context_documents=similar_docs
        )
        
        # Convert sources to response model
        sources = [
            Source(
                url=doc["url"],
                title=doc.get("title", ""),
                score=doc.get("score", 0.0)
            )
            for doc in rag_response["sources"]
        ]
        
        return QueryResponse(
            answer=rag_response["answer"],
            sources=sources,
            chat_id=request.chat_id,
            crawl_id=crawl_id,
            metadata=rag_response["metadata"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}"
        )

