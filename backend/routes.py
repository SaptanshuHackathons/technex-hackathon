from fastapi import APIRouter, HTTPException
from typing import List
from models import ScrapeRequest, ScrapeResponse, PageInfo, QueryRequest, QueryResponse, Source
from services.scraper import ScraperService
from services.embeddings import EmbeddingService
from services.vector_store import VectorStoreService
from services.rag import RAGService

router = APIRouter()

# Initialize services
scraper_service = ScraperService()
embedding_service = EmbeddingService()
vector_store_service = VectorStoreService()
rag_service = RAGService()

# In-memory storage for scraped pages (you might want to use a database)
scraped_pages_store: dict[str, PageInfo] = {}


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_website(request: ScrapeRequest):
    """
    Scrape a website and generate embeddings.
    Returns scraped pages with unique IDs.
    """
    try:
        # Scrape the website
        pages_data = await scraper_service.scrape_site(
            url=request.url,
            max_depth=request.max_depth
        )
        
        if not pages_data:
            raise HTTPException(
                status_code=404,
                detail="No pages were scraped. Please check the URL and try again."
            )
        
        # Generate embeddings and store in vector database
        for page_data in pages_data:
            # Generate embedding for the markdown content
            markdown = page_data.get("markdown", "")
            if markdown and len(markdown.strip()) > 0:
                try:
                    embedding = await embedding_service.generate_embeddings([markdown])
                    
                    # Store in vector database
                    await vector_store_service.store_embeddings(
                        page_id=page_data["page_id"],
                        url=page_data["url"],
                        markdown=markdown,
                        embedding=embedding[0],
                        metadata=page_data.get("metadata", {})
                    )
                except Exception as e:
                    print(f"Warning: Failed to generate/store embedding for {page_data['url']}: {str(e)}")
            
            # Store page info in memory
            page_info = PageInfo(
                page_id=page_data["page_id"],
                url=page_data["url"],
                markdown=markdown,
                metadata=page_data.get("metadata", {})
            )
            scraped_pages_store[page_data["page_id"]] = page_info
        
        # Convert to response model - get pages that were just scraped
        scraped_page_ids = {p["page_id"] for p in pages_data}
        pages = [scraped_pages_store[pid] for pid in scraped_page_ids if pid in scraped_pages_store]
        
        return ScrapeResponse(
            success=True,
            pages=pages,
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


@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the RAG system with a user question.
    Returns an answer with sources.
    """
    try:
        # Generate embedding for the query
        query_embedding = await embedding_service.generate_query_embedding(request.query)
        
        # Search for similar documents
        similar_docs = await vector_store_service.search_similar(
            query_embedding=query_embedding,
            limit=request.limit
        )
        
        if not similar_docs:
            raise HTTPException(
                status_code=404,
                detail="No relevant documents found. Please scrape a website first."
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
            metadata=rag_response["metadata"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}"
        )

