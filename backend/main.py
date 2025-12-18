from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI(
    title="Web Scraper & RAG Chatbot API",
    description="Backend API for web scraping and RAG-powered chatbot",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
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
            "query": "POST /api/query"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Run the server if this file is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)