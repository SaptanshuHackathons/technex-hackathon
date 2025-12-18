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

# Qdrant Configuration - Using local Qdrant by default
QDRANT_URL=http://localhost:6333
# Leave QDRANT_API_KEY empty for local Qdrant
# QDRANT_API_KEY=your_qdrant_cloud_api_key  # Only needed for Qdrant Cloud
```

### 3. Set Up Local Qdrant with Persistence

**Option A: Using Docker Compose (Recommended - with persistence)**

Run Qdrant with persistent storage using Docker Compose:

```bash
cd backend
docker-compose up -d qdrant
```

This will:
- Start Qdrant with data persisted to `./qdrant_storage/`
- Automatically restart if the container stops
- Preserve all embeddings and collections across restarts

**Option B: Using Docker directly (with persistence)**

Run Qdrant with a volume mount for persistence:

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  --restart unless-stopped \
  qdrant/qdrant
```

**Option C: Using Docker without persistence (data lost on restart)**

```bash
docker run -p 6333:6333 qdrant/qdrant
```

⚠️ **Warning**: Without volume mounts, all embeddings will be lost when the container stops!

The default configuration uses local Qdrant at `http://localhost:6333`. No API key is required for local instances.

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
  "max_depth": 3,
  "crawl_id": "optional-crawl-id"  // Optional: if not provided, a new crawl_id will be generated
}
```

**Response:**
```json
{
  "success": true,
  "crawl_id": "unique-crawl-id",
  "pages": [
    {
      "page_id": "uuid",
      "url": "https://example.com",
      "base_url": "https://example.com",
      "crawl_id": "unique-crawl-id",
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

**Note:** Each crawl gets a unique `crawl_id`. All vectors from a crawl are stored with this ID for isolation.

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

### 4. Create Chat Session

**POST** `/api/chats`

Create a new chat session linked to a crawl. Each chat is associated with a specific crawl, ensuring queries only search within that crawl's content.

**Request Body:**
```json
{
  "crawl_id": "unique-crawl-id"
}
```

**Response:**
```json
{
  "chat_id": "unique-chat-id",
  "crawl_id": "unique-crawl-id",
  "message": "Chat session created successfully"
}
```

### 5. Query RAG System

**POST** `/api/query`

Query the RAG system with a question. Only searches within the content from the chat's associated crawl.

**Request Body:**
```json
{
  "query": "What is this website about?",
  "chat_id": "unique-chat-id",
  "limit": 5
}
```

**Response:**
```json
{
  "answer": "This website is about...",
  "chat_id": "unique-chat-id",
  "crawl_id": "unique-crawl-id",
  "sources": [
    {
      "url": "https://example.com",
      "title": "Example",
      "score": 0.95
    }
  ],
  "metadata": {
    "model": "gemini-flash-latest",
    "context_documents_count": 5
  }
}
```

### 6. Get Chat Information

**GET** `/api/chats/{chat_id}`

Get metadata for a specific chat session.

### 7. List All Crawls

**GET** `/api/crawls`

List all crawl sessions with their metadata.

### 8. Get Crawl Information

**GET** `/api/crawls/{crawl_id}`

Get metadata for a specific crawl session.

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
│   ├── rag.py          # RAG query service
│   └── database.py     # Crawl and chat metadata storage
├── requirements.txt    # Python dependencies
└── crawl_chat_db.json  # Crawl and chat metadata (auto-generated)
```

## Key Features

### Crawl Isolation
- Each website crawl gets a unique `crawl_id`
- All vectors from a crawl are stored with this ID
- Crawls are completely isolated from each other

### Chat Sessions
- Each chat session is linked to a specific crawl via `chat_id`
- Queries only search within the associated crawl's content
- Multiple chats can be created for the same crawl
- **Chat sessions persist across server restarts** (stored in `crawl_chat_db.json`)

### Local Qdrant with Persistence
- Uses local Qdrant instance (no cloud API required)
- All vectors stored locally in Qdrant
- **Embeddings persist across Docker container restarts** (when using volume mounts)
- Collections are automatically detected and reused on restart
- Metadata stored in JSON file (`crawl_chat_db.json`)

### Data Persistence
- **Chat metadata**: Persisted in `crawl_chat_db.json` (survives server restarts)
- **Embeddings**: Persisted in Qdrant storage directory (survives container restarts when using volumes)
- **Automatic recovery**: Collections and data are automatically loaded when Qdrant restarts

## Notes

- The embedding dimension is set to 384 for `sentence-transformers/all-MiniLM-L6-v2` model
- Embeddings use Hugging Face Inference API (requires API key, no local model download)
- Get your free API key from https://huggingface.co/settings/tokens
- Free tier includes generous rate limits for embeddings
- Scraped pages are stored in-memory (consider using a database for production)
- Crawl and chat metadata stored in `crawl_chat_db.json` (automatically created)
- CORS is configured for Next.js frontend on `localhost:3000`
- Adjust `max_depth` in scrape requests to control crawl depth


