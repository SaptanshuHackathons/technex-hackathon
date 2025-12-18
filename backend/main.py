from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import config  # Load environment variables first
from routes import router

app = FastAPI(
    title="Web Scraper & RAG Chatbot API",
    description="Backend API for web scraping and RAG-powered chatbot",
    version="1.0.0",
)

# Configure CORS - Allow all origins for development (including file:// protocol for widget demo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api", tags=["api"])


@app.get("/")
async def root():
    return {
        "message": "Web Scraper & RAG Chatbot API",
        "version": "1.0.0",
        "endpoints": {
            "scrape": "POST /api/scrape",
            "get_pages": "GET /api/pages",
            "get_page": "GET /api/pages/{page_id}",
            "query": "POST /api/query",
            "create_chat": "POST /api/chats",
            "get_chat": "GET /api/chats/{chat_id}",
            "list_crawls": "GET /api/crawls",
            "get_crawl": "GET /api/crawls/{crawl_id}",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Run the server if this file is executed directly
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
