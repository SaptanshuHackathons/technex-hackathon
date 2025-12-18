# Web Scraper & RAG Chatbot Backend

FastAPI backend for web scraping and RAG-powered chatbot using FireCrawl, Hugging Face Inference API (for embeddings), Google Gemini (for chat), and Qdrant.

## Features

- **Web Scraping**: Scrape entire websites using FireCrawl
- **Embeddings**: Generate embeddings using Hugging Face Inference API (BAAI/bge-m3 model)
- **Vector Storage**: Store and retrieve embeddings using Qdrant
- **RAG Chatbot**: Answer questions using retrieved context from scraped content with Google Gemini

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# FireCrawl API Key (get from https://firecrawl.dev)
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Google Gemini API Key (for chat/RAG responses, get from https://makersuite.google.com/app/apikey)
GOOGLE_API_KEY=your_google_api_key_here

# Hugging Face Inference API Key (get from https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Hugging Face Embedding Model (optional, defaults to BAAI/bge-m3)
# EMBEDDING_MODEL_NAME=BAAI/bge-m3

# Qdrant Configuration
# For Qdrant Cloud (Recommended):
QDRANT_URL=https://your-cluster-id.qdrant.io
QDRANT_API_KEY=your_qdrant_cloud_api_key

# For local Qdrant (optional):
# QDRANT_URL=http://localhost:6333
# Leave QDRANT_API_KEY empty for local
```

### 3. Set Up Qdrant

#### Option A: Qdrant Cloud (Recommended)

1. Sign up at [Qdrant Cloud](https://cloud.qdrant.io)
2. Create a cluster
3. Get your API key and cluster URL
4. Add them to your `.env` file:
   ```env
   QDRANT_URL=https://your-cluster-id.qdrant.io
   QDRANT_API_KEY=your_qdrant_cloud_api_key
   ```

#### Option B: Local Qdrant (Docker)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 4. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### 1. Scrape Website

**POST** `/api/scrape`

Scrape a website and generate embeddings.

**Request Body:**
```json
{
  "url": "https://example.com",
  "max_depth": 3
}
```

**Response:**
```json
{
  "success": true,
  "pages": [
    {
      "page_id": "uuid",
      "url": "https://example.com",
      "markdown": "...",
      "metadata": {
        "title": "Example",
        "description": "...",
        "statusCode": 200
      }
    }
  ],
  "message": "Successfully scraped 5 pages"
}
```

### 2. Get All Scraped Pages

**GET** `/api/pages`

Returns all scraped pages with their IDs.

**Response:**
```json
[
  {
    "page_id": "uuid",
    "url": "https://example.com",
    "markdown": "...",
    "metadata": {...}
  }
]
```

### 3. Get Specific Page

**GET** `/api/pages/{page_id}`

Returns a specific scraped page by ID.

### 4. Query RAG System

**POST** `/api/query`

Query the RAG system with a question.

**Request Body:**
```json
{
  "query": "What is this website about?",
  "limit": 5
}
```

**Response:**
```json
{
  "answer": "This website is about...",
  "sources": [
    {
      "url": "https://example.com",
      "title": "Example",
      "score": 0.95
    }
  ],
  "metadata": {
    "model": "gemini-2.0-flash-exp",
    "context_documents_count": 5
  }
}
```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py           # Configuration and environment variables
├── models.py           # Pydantic models for request/response
├── routes.py           # API routes
├── services/
│   ├── scraper.py      # FireCrawl scraping service
│   ├── embeddings.py   # Hugging Face Inference API embedding service
│   ├── vector_store.py # Qdrant vector store service
│   └── rag.py          # RAG query service
└── requirements.txt    # Python dependencies
```

## Notes

- The embedding dimension is set to 1024 for BAAI/bge-m3 model
- Embeddings use Hugging Face Inference API (requires API key, no local model download)
- Get your free API key from https://huggingface.co/settings/tokens
- Free tier includes generous rate limits for embeddings
- Scraped pages are stored in-memory (consider using a database for production)
- CORS is configured for Next.js frontend on `localhost:3000`
- Adjust `max_depth` in scrape requests to control crawl depth


