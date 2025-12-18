import asyncio
from typing import List
from huggingface_hub import InferenceClient
from config import HUGGINGFACE_API_KEY, EMBEDDING_MODEL_NAME


class EmbeddingService:
    def __init__(self):
        # Use huggingface_hub InferenceClient for better model routing
        self.client = InferenceClient(
            model=EMBEDDING_MODEL_NAME,
            token=HUGGINGFACE_API_KEY
        )
        print(f"Using Hugging Face Inference API: {EMBEDDING_MODEL_NAME}")
    
    async def _call_api(self, texts: List[str]) -> List[List[float]]:
        """
        Call Hugging Face Inference API to generate embeddings using InferenceClient.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        # Use InferenceClient which handles routing correctly
        def _embed():
            # InferenceClient.feature_extraction handles the API call correctly
            # It automatically routes to the right endpoint
            if len(texts) == 1:
                # Single text
                result = self.client.feature_extraction(texts[0])
                return [result] if isinstance(result, list) and len(result) > 0 and isinstance(result[0], (int, float)) else [result]
            else:
                # Multiple texts - process individually to ensure correct format
                embeddings = []
                for text in texts:
                    result = self.client.feature_extraction(text)
                    if isinstance(result, list) and len(result) > 0:
                        if isinstance(result[0], (int, float)):
                            embeddings.append(result)
                        elif isinstance(result[0], list):
                            embeddings.append(result[0])
                    else:
                        embeddings.append(result)
                return embeddings
        
        # Run in thread pool to avoid blocking
        embeddings = await asyncio.to_thread(_embed)
        return embeddings
    
            
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts using Hugging Face Inference API.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            # Normalize embeddings after getting them from API
            embeddings = await self._call_api(texts)
            
            # Normalize embeddings for better cosine similarity
            normalized_embeddings = []
            for emb in embeddings:
                import math
                norm = math.sqrt(sum(x * x for x in emb))
                if norm > 0:
                    normalized = [x / norm for x in emb]
                else:
                    normalized = emb
                normalized_embeddings.append(normalized)
            
            return normalized_embeddings
        except Exception as e:
            raise Exception(f"Embedding generation failed: {str(e)}")
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a single query using Hugging Face Inference API.
        
        Args:
            query: Query string to embed
            
        Returns:
            Embedding vector
        """
        try:
            # Use the same method but for a single text
            embeddings = await self.generate_embeddings([query])
            return embeddings[0]
        except Exception as e:
            raise Exception(f"Query embedding generation failed: {str(e)}")

