import os
from dotenv import load_dotenv

load_dotenv()

# FireCrawl Configuration
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

# Google Gemini Configuration (for chat/RAG, not embeddings)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = "gemini-flash-latest"  # or "gemini-1.5-pro" for better quality

# Hugging Face Inference API Configuration
# Using sentence-transformers/all-MiniLM-L6-v2 as default (better Inference API support)
# Alternative: BAAI/bge-m3 (1024 dims) but may have routing issues with Inference API
# Note: Using the new router endpoint (api-inference.huggingface.co is deprecated)
# Router endpoint format: https://router.huggingface.co/hf-inference/models/{model_name}
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
# Use models endpoint (router handles routing automatically)
HUGGINGFACE_API_URL = f"https://router.huggingface.co/hf-inference/models/{EMBEDDING_MODEL_NAME}"

# Qdrant Configuration - Using local Qdrant by default
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)  # None for local Qdrant

# Vector Store Configuration
COLLECTION_NAME = "scraped_pages"
WIDGET_COLLECTION_NAME = "widget_embeddings"  # Separate collection for widget sites
# Default embedding dimension (all-MiniLM-L6-v2 is 384, bge-m3 is 1024)
# Update this if you change the model
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "384"))  # 384 for all-MiniLM-L6-v2, 1024 for bge-m3

# Widget-specific Supabase Configuration (separate from main app)
WIDGET_SUPABASE_URL = os.getenv("WIDGET_SUPABASE_URL")
WIDGET_SUPABASE_KEY = os.getenv("WIDGET_SUPABASE_KEY")

# Widget API Key validation (simple prefix-based for now)
WIDGET_API_KEY_PREFIX = os.getenv("WIDGET_API_KEY_PREFIX", "astra_")

