import hashlib
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from config import QDRANT_URL, QDRANT_API_KEY, COLLECTION_NAME, EMBEDDING_DIMENSION, WIDGET_COLLECTION_NAME


class VectorStoreService:
    def __init__(self):
        # Initialize Qdrant client
        # Supports both Qdrant Cloud (with API key) and local instances
        if QDRANT_API_KEY:
            self.client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
            print(f"Connected to Qdrant Cloud: {QDRANT_URL}")
        else:
            # Local Qdrant instance
            self.client = QdrantClient(url=QDRANT_URL)
            print(f"Connected to local Qdrant: {QDRANT_URL}")

        self.collection_name = COLLECTION_NAME
        self._ensure_collection_exists()
        self._ensure_payload_indexes()

    def _generate_stable_id(self, page_id: str) -> int:
        """Generate a stable int64 ID from page_id using SHA256 hash."""
        hash_bytes = hashlib.sha256(page_id.encode("utf-8")).digest()
        # Use first 8 bytes for int64, mask to ensure positive
        return int.from_bytes(hash_bytes[:8], byteorder="big") & 0x7FFFFFFFFFFFFFFF

    def _ensure_payload_indexes(self):
        """Create payload indexes for faster filtering on commonly queried fields."""
        try:
            # Check if collection exists first
            collections = self.client.get_collections().collections
            if self.collection_name not in [c.name for c in collections]:
                return

            # Create index for crawl_id (most common filter)
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="crawl_id",
                    field_schema="keyword",
                )
            except Exception:
                pass  # Index may already exist

            # Create index for url
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="url",
                    field_schema="keyword",
                )
            except Exception:
                pass  # Index may already exist

        except Exception as e:
            print(f"Warning: Could not create payload indexes: {str(e)}")

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
                        size=EMBEDDING_DIMENSION, distance=Distance.COSINE
                    ),
                )
                print(
                    f"Created Qdrant collection: {self.collection_name} with dimension {EMBEDDING_DIMENSION}"
                )
            else:
                # Collection exists, check if dimension matches
                collection_info = self.client.get_collection(self.collection_name)
                existing_dim = None

                # Extract dimension from collection config - handle multiple formats
                try:
                    # Try different ways to access the dimension
                    if hasattr(collection_info, "config"):
                        config = collection_info.config
                        if hasattr(config, "params"):
                            params = config.params
                            if hasattr(params, "vectors"):
                                vectors = params.vectors
                                # Handle different vector config formats
                                if hasattr(vectors, "size"):
                                    existing_dim = vectors.size
                                elif isinstance(vectors, dict):
                                    existing_dim = vectors.get("size")
                                elif hasattr(vectors, "params") and hasattr(
                                    vectors.params, "size"
                                ):
                                    existing_dim = vectors.params.size

                    # Alternative: try accessing directly
                    if existing_dim is None:
                        # Try to get it from the collection info directly
                        if hasattr(collection_info, "config") and hasattr(
                            collection_info.config, "params"
                        ):
                            params = collection_info.config.params
                            # Check if it's a named vectors config
                            if hasattr(params, "vectors") and isinstance(
                                params.vectors, dict
                            ):
                                # For named vectors, get the default vector size
                                if "size" in params.vectors:
                                    existing_dim = params.vectors["size"]
                                elif (
                                    isinstance(params.vectors, dict)
                                    and len(params.vectors) > 0
                                ):
                                    # Get first vector config
                                    first_vector = list(params.vectors.values())[0]
                                    if (
                                        isinstance(first_vector, dict)
                                        and "size" in first_vector
                                    ):
                                        existing_dim = first_vector["size"]
                                    elif hasattr(first_vector, "size"):
                                        existing_dim = first_vector.size

                    print(f"Detected collection dimension: {existing_dim}")

                except Exception as e:
                    print(
                        f"Warning: Could not extract dimension from collection: {str(e)}"
                    )

                # If dimension doesn't match, recreate collection
                if existing_dim is not None and existing_dim != EMBEDDING_DIMENSION:
                    print(f"⚠️  Collection dimension mismatch detected!")
                    print(f"   Existing dimension: {existing_dim}")
                    print(f"   Required dimension: {EMBEDDING_DIMENSION}")
                    print(
                        f"   Deleting and recreating collection: {self.collection_name}"
                    )
                    print(
                        f"   Note: All existing data in this collection will be lost."
                    )
                    try:
                        # Delete the old collection
                        self.client.delete_collection(
                            collection_name=self.collection_name
                        )
                        # Recreate with correct dimension
                        self.client.create_collection(
                            collection_name=self.collection_name,
                            vectors_config=VectorParams(
                                size=EMBEDDING_DIMENSION, distance=Distance.COSINE
                            ),
                        )
                        print(
                            f"✅ Recreated Qdrant collection: {self.collection_name} with dimension {EMBEDDING_DIMENSION}"
                        )
                        print(
                            f"   You'll need to re-scrape websites to populate the collection."
                        )
                    except Exception as recreate_error:
                        print(f"❌ Error recreating collection: {str(recreate_error)}")
                        print(
                            f"   You may need to manually delete the collection via Qdrant Cloud dashboard"
                        )
                        raise
                elif existing_dim is None:
                    # Couldn't determine dimension, but collection exists - assume it's correct
                    print(
                        f"Using existing Qdrant collection: {self.collection_name} (could not verify dimension)"
                    )
                else:
                    # Try to get point count to show data persistence
                    try:
                        collection_info = self.client.get_collection(
                            self.collection_name
                        )
                        point_count = getattr(collection_info, "points_count", None)
                        if point_count is not None:
                            print(
                                f"Using existing Qdrant collection: {self.collection_name} (dimension: {existing_dim}, points: {point_count})"
                            )
                        else:
                            print(
                                f"Using existing Qdrant collection: {self.collection_name} (dimension: {existing_dim})"
                            )
                    except Exception:
                        print(
                            f"Using existing Qdrant collection: {self.collection_name} (dimension: {existing_dim})"
                        )
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
        base_url: Optional[str] = None,
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
                "base_url": base_url
                or url,  # Use base_url if provided, otherwise use url
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
                id=self._generate_stable_id(page_id), vector=embedding, payload=payload
            )

            try:
                self.client.upsert(collection_name=self.collection_name, points=[point])
            except Exception as upsert_error:
                error_msg = str(upsert_error)
                # If collection doesn't exist, try to recreate it and retry once
                if (
                    "doesn't exist" in error_msg.lower()
                    or "not found" in error_msg.lower()
                ):
                    print(
                        f"Collection {self.collection_name} not found during upsert, recreating..."
                    )
                    self._ensure_collection_exists()
                    # Retry the upsert
                    self.client.upsert(
                        collection_name=self.collection_name, points=[point]
                    )
                else:
                    raise

            return True
        except Exception as e:
            raise Exception(f"Failed to store embedding: {str(e)}")

    async def store_embeddings_batch(
        self, embeddings_data: List[Dict[str, Any]]
    ) -> bool:
        """
        Store multiple embeddings in a single batch operation for better performance.

        Args:
            embeddings_data: List of dicts containing page_id, url, markdown, embedding, metadata, crawl_id, base_url

        Returns:
            True if successful
        """
        try:
            if not embeddings_data:
                return True

            # Ensure collection exists before storing
            self._ensure_collection_exists()

            # Build all points
            points = []
            for data in embeddings_data:
                payload = {
                    "page_id": data["page_id"],
                    "url": data["url"],
                    "base_url": data.get("base_url") or data["url"],
                    "markdown": data["markdown"],
                    "title": data.get("metadata", {}).get("title", ""),
                    "description": data.get("metadata", {}).get("description", ""),
                    "crawl_id": data["crawl_id"],
                }

                # Add chunk metadata if present
                metadata = data.get("metadata", {})
                if "chunk_index" in metadata:
                    payload["chunk_index"] = metadata["chunk_index"]
                if "total_chunks" in metadata:
                    payload["total_chunks"] = metadata["total_chunks"]
                if "original_page_id" in metadata:
                    payload["original_page_id"] = metadata["original_page_id"]

                point = PointStruct(
                    id=self._generate_stable_id(data["page_id"]),
                    vector=data["embedding"],
                    payload=payload,
                )
                points.append(point)

            # Batch upsert all points at once - much faster than individual upserts
            try:
                self.client.upsert(collection_name=self.collection_name, points=points)
            except Exception as upsert_error:
                error_msg = str(upsert_error)
                if (
                    "doesn't exist" in error_msg.lower()
                    or "not found" in error_msg.lower()
                ):
                    print(
                        f"Collection {self.collection_name} not found during batch upsert, recreating..."
                    )
                    self._ensure_collection_exists()
                    self.client.upsert(
                        collection_name=self.collection_name, points=points
                    )
                else:
                    raise

            return True
        except Exception as e:
            raise Exception(f"Failed to batch store embeddings: {str(e)}")

    async def search_similar(
        self, query_embedding: List[float], crawl_id: str, limit: int = 5
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
            search_url = (
                f"{QDRANT_URL}/collections/{self.collection_name}/points/search"
            )
            headers = {"Content-Type": "application/json"}
            if QDRANT_API_KEY:
                headers["api-key"] = QDRANT_API_KEY

            # Qdrant HTTP API filter format
            payload = {
                "vector": query_vector,
                "limit": limit,
                "with_payload": True,
                "filter": {"must": [{"key": "crawl_id", "match": {"value": crawl_id}}]},
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
                    payload_data = point.payload if hasattr(point, "payload") else {}
                    score = getattr(point, "score", 0.0)

                # Ensure payload is a dict
                if not isinstance(payload_data, dict):
                    payload_data = {}

                # Double-check crawl_id filter (defensive)
                if payload_data.get("crawl_id") != crawl_id:
                    continue

                results.append(
                    {
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
                            "original_page_id": payload_data.get("original_page_id"),
                        },
                    }
                )

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
            point_id = self._generate_stable_id(page_id)
            self.client.delete(
                collection_name=self.collection_name, points_selector=[point_id]
            )
            return True
        except Exception as e:
            raise Exception(f"Failed to delete page: {str(e)}")

    # ============== Widget-specific methods ==============

    def _ensure_widget_collection_exists(self):
        """Create the widget embeddings collection if it doesn't exist."""
        try:
            collections = self.client.get_collections().collections
            collection_names = [col.name for col in collections]

            if WIDGET_COLLECTION_NAME not in collection_names:
                self.client.create_collection(
                    collection_name=WIDGET_COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=EMBEDDING_DIMENSION, distance=Distance.COSINE
                    ),
                )
                print(f"Created widget collection: {WIDGET_COLLECTION_NAME}")
                
                # Create indexes for widget collection
                try:
                    self.client.create_payload_index(
                        collection_name=WIDGET_COLLECTION_NAME,
                        field_name="site_id",
                        field_schema="keyword",
                    )
                except Exception:
                    pass
        except Exception as e:
            print(f"Error ensuring widget collection exists: {str(e)}")
            raise

    async def widget_has_embeddings(self, site_id: str) -> tuple[bool, int]:
        """
        Check if embeddings exist for a given site_id.
        
        Returns:
            Tuple of (has_embeddings, count)
        """
        try:
            self._ensure_widget_collection_exists()
            
            # Count points with this site_id
            import httpx
            count_url = f"{QDRANT_URL}/collections/{WIDGET_COLLECTION_NAME}/points/count"
            headers = {"Content-Type": "application/json"}
            if QDRANT_API_KEY:
                headers["api-key"] = QDRANT_API_KEY

            payload = {
                "filter": {"must": [{"key": "site_id", "match": {"value": site_id}}]}
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(count_url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                count = result.get("result", {}).get("count", 0)
                return (count > 0, count)
        except Exception as e:
            print(f"Error checking widget embeddings: {str(e)}")
            return (False, 0)

    async def widget_store_embeddings_batch(
        self, site_id: str, embeddings_data: List[Dict[str, Any]]
    ) -> bool:
        """
        Store embeddings for a widget site.
        
        Args:
            site_id: Unique site identifier
            embeddings_data: List of embedding data dicts
        """
        try:
            if not embeddings_data:
                return True

            self._ensure_widget_collection_exists()

            points = []
            for data in embeddings_data:
                payload = {
                    "site_id": site_id,
                    "page_id": data["page_id"],
                    "url": data["url"],
                    "markdown": data["markdown"],
                    "title": data.get("metadata", {}).get("title", ""),
                    "description": data.get("metadata", {}).get("description", ""),
                    "label": data.get("label", ""),
                }

                # Add chunk metadata
                metadata = data.get("metadata", {})
                if "chunk_index" in metadata:
                    payload["chunk_index"] = metadata["chunk_index"]
                if "total_chunks" in metadata:
                    payload["total_chunks"] = metadata["total_chunks"]

                # Use site_id + page_id for unique point ID
                point_id = self._generate_stable_id(f"{site_id}:{data['page_id']}")
                point = PointStruct(
                    id=point_id, vector=data["embedding"], payload=payload
                )
                points.append(point)

            self.client.upsert(collection_name=WIDGET_COLLECTION_NAME, points=points)
            return True
        except Exception as e:
            raise Exception(f"Failed to store widget embeddings: {str(e)}")

    async def widget_search_similar(
        self, query_embedding: List[float], site_id: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents in a widget site's embeddings.
        """
        try:
            import httpx

            query_vector = [float(x) for x in query_embedding]

            search_url = f"{QDRANT_URL}/collections/{WIDGET_COLLECTION_NAME}/points/search"
            headers = {"Content-Type": "application/json"}
            if QDRANT_API_KEY:
                headers["api-key"] = QDRANT_API_KEY

            payload = {
                "vector": query_vector,
                "limit": limit,
                "with_payload": True,
                "filter": {"must": [{"key": "site_id", "match": {"value": site_id}}]},
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(search_url, json=payload, headers=headers)
                response.raise_for_status()
                result_data = response.json()

            points = result_data.get("result", [])
            results = []

            for point in points:
                payload_data = point.get("payload", {}) if isinstance(point, dict) else {}
                score = point.get("score", 0.0) if isinstance(point, dict) else 0.0

                results.append({
                    "page_id": payload_data.get("page_id", ""),
                    "url": payload_data.get("url", ""),
                    "markdown": payload_data.get("markdown", ""),
                    "title": payload_data.get("title", ""),
                    "label": payload_data.get("label", ""),
                    "score": float(score),
                })

            return results
        except Exception as e:
            raise Exception(f"Widget vector search failed: {str(e)}")

    async def widget_delete_site_embeddings(self, site_id: str) -> bool:
        """
        Delete all embeddings for a site (used before refresh).
        """
        try:
            import httpx

            delete_url = f"{QDRANT_URL}/collections/{WIDGET_COLLECTION_NAME}/points/delete"
            headers = {"Content-Type": "application/json"}
            if QDRANT_API_KEY:
                headers["api-key"] = QDRANT_API_KEY

            payload = {
                "filter": {"must": [{"key": "site_id", "match": {"value": site_id}}]}
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(delete_url, json=payload, headers=headers)
                response.raise_for_status()

            return True
        except Exception as e:
            raise Exception(f"Failed to delete widget embeddings: {str(e)}")
