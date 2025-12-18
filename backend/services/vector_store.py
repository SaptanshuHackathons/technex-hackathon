from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from config import QDRANT_URL, QDRANT_API_KEY, COLLECTION_NAME, EMBEDDING_DIMENSION


class VectorStoreService:
    def __init__(self):
        # Initialize Qdrant client
        # Supports both Qdrant Cloud (with API key) and local instances
        if QDRANT_API_KEY:
            self.client = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY
            )
            print(f"Connected to Qdrant Cloud: {QDRANT_URL}")
        else:
            # Local Qdrant instance
            self.client = QdrantClient(url=QDRANT_URL)
            print(f"Connected to local Qdrant: {QDRANT_URL}")
        
        self.collection_name = COLLECTION_NAME
        self._ensure_collection_exists()
    
    def _ensure_collection_exists(self):
        """Create collection if it doesn't exist, or recreate if dimension mismatch."""
        try:
            collections = self.client.get_collections().collections
            collection_names = [col.name for col in collections]
            
            if self.collection_name not in collection_names:
                # Collection doesn't exist, create it
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=EMBEDDING_DIMENSION,
                        distance=Distance.COSINE
                    )
                )
                print(f"Created Qdrant collection: {self.collection_name} with dimension {EMBEDDING_DIMENSION}")
            else:
                # Collection exists, check if dimension matches
                collection_info = self.client.get_collection(self.collection_name)
                existing_dim = None
                
                # Extract dimension from collection config - handle multiple formats
                try:
                    # Try different ways to access the dimension
                    if hasattr(collection_info, 'config'):
                        config = collection_info.config
                        if hasattr(config, 'params'):
                            params = config.params
                            if hasattr(params, 'vectors'):
                                vectors = params.vectors
                                # Handle different vector config formats
                                if hasattr(vectors, 'size'):
                                    existing_dim = vectors.size
                                elif isinstance(vectors, dict):
                                    existing_dim = vectors.get('size')
                                elif hasattr(vectors, 'params') and hasattr(vectors.params, 'size'):
                                    existing_dim = vectors.params.size
                    
                    # Alternative: try accessing directly
                    if existing_dim is None:
                        # Try to get it from the collection info directly
                        if hasattr(collection_info, 'config') and hasattr(collection_info.config, 'params'):
                            params = collection_info.config.params
                            # Check if it's a named vectors config
                            if hasattr(params, 'vectors') and isinstance(params.vectors, dict):
                                # For named vectors, get the default vector size
                                if 'size' in params.vectors:
                                    existing_dim = params.vectors['size']
                                elif isinstance(params.vectors, dict) and len(params.vectors) > 0:
                                    # Get first vector config
                                    first_vector = list(params.vectors.values())[0]
                                    if isinstance(first_vector, dict) and 'size' in first_vector:
                                        existing_dim = first_vector['size']
                                    elif hasattr(first_vector, 'size'):
                                        existing_dim = first_vector.size
                    
                    print(f"Detected collection dimension: {existing_dim}")
                    
                except Exception as e:
                    print(f"Warning: Could not extract dimension from collection: {str(e)}")
                
                # If dimension doesn't match, recreate collection
                if existing_dim is not None and existing_dim != EMBEDDING_DIMENSION:
                    print(f"⚠️  Collection dimension mismatch detected!")
                    print(f"   Existing dimension: {existing_dim}")
                    print(f"   Required dimension: {EMBEDDING_DIMENSION}")
                    print(f"   Deleting and recreating collection: {self.collection_name}")
                    print(f"   Note: All existing data in this collection will be lost.")
                    try:
                        # Delete the old collection
                        self.client.delete_collection(collection_name=self.collection_name)
                        # Recreate with correct dimension
                        self.client.create_collection(
                            collection_name=self.collection_name,
                            vectors_config=VectorParams(
                                size=EMBEDDING_DIMENSION,
                                distance=Distance.COSINE
                            )
                        )
                        print(f"✅ Recreated Qdrant collection: {self.collection_name} with dimension {EMBEDDING_DIMENSION}")
                        print(f"   You'll need to re-scrape websites to populate the collection.")
                    except Exception as recreate_error:
                        print(f"❌ Error recreating collection: {str(recreate_error)}")
                        print(f"   You may need to manually delete the collection via Qdrant Cloud dashboard")
                        raise
                elif existing_dim is None:
                    # Couldn't determine dimension, but collection exists - assume it's correct
                    print(f"Using existing Qdrant collection: {self.collection_name} (could not verify dimension)")
                else:
                    # Try to get point count to show data persistence
                    try:
                        collection_info = self.client.get_collection(self.collection_name)
                        point_count = getattr(collection_info, 'points_count', None)
                        if point_count is not None:
                            print(f"Using existing Qdrant collection: {self.collection_name} (dimension: {existing_dim}, points: {point_count})")
                        else:
                            print(f"Using existing Qdrant collection: {self.collection_name} (dimension: {existing_dim})")
                    except Exception:
                        print(f"Using existing Qdrant collection: {self.collection_name} (dimension: {existing_dim})")
        except Exception as e:
            print(f"Error ensuring collection exists: {str(e)}")
            # Re-raise if it's a critical error
            if "connection" in str(e).lower() or "timeout" in str(e).lower():
                raise
    
    async def store_embeddings(
        self, 
        page_id: str,
        url: str,
        markdown: str,
        embedding: List[float],
        metadata: Dict[str, Any],
        crawl_id: str,
        base_url: Optional[str] = None
    ) -> bool:
        """
        Store a page embedding in Qdrant.
        
        Args:
            page_id: Unique page identifier
            url: Page URL
            markdown: Page markdown content
            embedding: Embedding vector
            metadata: Additional metadata
            crawl_id: Unique crawl session ID
            base_url: Base URL of the website (for filtering)
            
        Returns:
            True if successful
        """
        try:
            # Ensure collection exists before storing (handles race conditions)
            self._ensure_collection_exists()
            
            # Build payload with all metadata
            payload = {
                "page_id": page_id,
                "url": url,
                "base_url": base_url or url,  # Use base_url if provided, otherwise use url
                "markdown": markdown,
                "title": metadata.get("title", ""),
                "description": metadata.get("description", ""),
                "crawl_id": crawl_id,  # Store crawl_id for filtering
            }
            
            # Add chunk metadata if present
            if "chunk_index" in metadata:
                payload["chunk_index"] = metadata["chunk_index"]
            if "total_chunks" in metadata:
                payload["total_chunks"] = metadata["total_chunks"]
            if "original_page_id" in metadata:
                payload["original_page_id"] = metadata["original_page_id"]
            
            point = PointStruct(
                id=hash(page_id) % (2**63),  # Convert to int64
                vector=embedding,
                payload=payload
            )
            
            try:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=[point]
                )
            except Exception as upsert_error:
                error_msg = str(upsert_error)
                # If collection doesn't exist, try to recreate it and retry once
                if "doesn't exist" in error_msg.lower() or "not found" in error_msg.lower():
                    print(f"Collection {self.collection_name} not found during upsert, recreating...")
                    self._ensure_collection_exists()
                    # Retry the upsert
                    self.client.upsert(
                        collection_name=self.collection_name,
                        points=[point]
                    )
                else:
                    raise
            
            return True
        except Exception as e:
            raise Exception(f"Failed to store embedding: {str(e)}")
    
    async def search_similar(
        self, 
        query_embedding: List[float], 
        crawl_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using query embedding, filtered by crawl_id.
        
        Args:
            query_embedding: Query embedding vector
            crawl_id: Crawl session ID to filter results (only search within this crawl)
            limit: Maximum number of results
            
        Returns:
            List of similar documents with scores
        """
        try:
            import httpx
            
            # Convert embedding to list of regular Python floats (handle numpy float32)
            query_vector = [float(x) for x in query_embedding]
            
            # Build search payload for Qdrant HTTP API
            search_url = f"{QDRANT_URL}/collections/{self.collection_name}/points/search"
            headers = {"Content-Type": "application/json"}
            if QDRANT_API_KEY:
                headers["api-key"] = QDRANT_API_KEY
            
            # Qdrant HTTP API filter format
            payload = {
                "vector": query_vector,
                "limit": limit,
                "with_payload": True,
                "filter": {
                    "must": [
                        {
                            "key": "crawl_id",
                            "match": {
                                "value": crawl_id
                            }
                        }
                    ]
                }
            }
            
            # Make HTTP request to Qdrant API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(search_url, json=payload, headers=headers)
                response.raise_for_status()
                result_data = response.json()
            
            points = result_data.get("result", [])
            
            results = []
            # Process points (list of dicts from HTTP API)
            for point in points:
                # HTTP API returns dicts with 'payload' and 'score' keys
                if isinstance(point, dict):
                    payload_data = point.get("payload", {})
                    score = point.get("score", 0.0)
                else:
                    # Fallback for object format
                    payload_data = point.payload if hasattr(point, 'payload') else {}
                    score = getattr(point, 'score', 0.0)
                
                # Ensure payload is a dict
                if not isinstance(payload_data, dict):
                    payload_data = {}
                
                # Double-check crawl_id filter (defensive)
                if payload_data.get("crawl_id") != crawl_id:
                    continue
                
                results.append({
                    "page_id": payload_data.get("page_id", ""),
                    "url": payload_data.get("url", ""),
                    "base_url": payload_data.get("base_url", ""),
                    "markdown": payload_data.get("markdown", ""),
                    "title": payload_data.get("title", ""),
                    "crawl_id": payload_data.get("crawl_id", ""),
                    "score": float(score),
                    "metadata": {
                        "chunk_index": payload_data.get("chunk_index"),
                        "total_chunks": payload_data.get("total_chunks"),
                        "original_page_id": payload_data.get("original_page_id")
                    }
                })
            
            return results
        except Exception as e:
            raise Exception(f"Vector search failed: {str(e)}")
    
    async def delete_page(self, page_id: str) -> bool:
        """
        Delete a page from the vector store.
        
        Args:
            page_id: Page ID to delete
            
        Returns:
            True if successful
        """
        try:
            point_id = hash(page_id) % (2**63)
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[point_id]
            )
            return True
        except Exception as e:
            raise Exception(f"Failed to delete page: {str(e)}")

