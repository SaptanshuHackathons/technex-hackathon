from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
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
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Store a page embedding in Qdrant.
        
        Args:
            page_id: Unique page identifier
            url: Page URL
            markdown: Page markdown content
            embedding: Embedding vector
            metadata: Additional metadata
            
        Returns:
            True if successful
        """
        try:
            point = PointStruct(
                id=hash(page_id) % (2**63),  # Convert to int64
                vector=embedding,
                payload={
                    "page_id": page_id,
                    "url": url,
                    "markdown": markdown,
                    "title": metadata.get("title", ""),
                    "description": metadata.get("description", ""),
                }
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            return True
        except Exception as e:
            raise Exception(f"Failed to store embedding: {str(e)}")
    
    async def search_similar(
        self, 
        query_embedding: List[float], 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using query embedding.
        
        Args:
            query_embedding: Query embedding vector
            limit: Maximum number of results
            
        Returns:
            List of similar documents with scores
        """
        try:
            # Use query_points with a simple query vector
            # For single vector collections, pass the vector directly
            search_results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_embedding,  # Pass vector directly
                limit=limit,
                with_payload=True
            )
            
            results = []
            # QueryResponse has a points attribute containing ScoredPoint objects
            points = search_results.points if hasattr(search_results, 'points') else []
            
            for point in points:
                # ScoredPoint has payload and score attributes
                payload = point.payload if hasattr(point, 'payload') else {}
                score = getattr(point, 'score', 0.0)
                
                # Ensure payload is a dict
                if not isinstance(payload, dict):
                    payload = {}
                
                results.append({
                    "page_id": payload.get("page_id", ""),
                    "url": payload.get("url", ""),
                    "markdown": payload.get("markdown", ""),
                    "title": payload.get("title", ""),
                    "score": float(score)
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

