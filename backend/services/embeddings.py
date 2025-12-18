import asyncio
import time
import random
from typing import List
from huggingface_hub import InferenceClient
from config import HUGGINGFACE_API_KEY, EMBEDDING_MODEL_NAME


class EmbeddingService:
    def __init__(self):
        # Use huggingface_hub InferenceClient for better model routing
        self.client = InferenceClient(
            model=EMBEDDING_MODEL_NAME, token=HUGGINGFACE_API_KEY
        )
        # Retry configuration
        self.max_retries = 3
        self.base_delay = 1.0  # seconds
        self.max_delay = 10.0  # seconds
        print(f"Using Hugging Face Inference API: {EMBEDDING_MODEL_NAME}")

    def _retry_with_backoff(self, func, *args, **kwargs):
        """Execute function with exponential backoff retry logic."""
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    # Exponential backoff with jitter
                    delay = min(
                        self.base_delay * (2**attempt) + random.uniform(0, 1),
                        self.max_delay,
                    )
                    print(
                        f"Embedding API attempt {attempt + 1} failed: {str(e)}. Retrying in {delay:.1f}s..."
                    )
                    time.sleep(delay)
        raise last_exception

    async def _call_api(self, texts: List[str]) -> List[List[float]]:
        """
        Call Hugging Face Inference API to generate embeddings using InferenceClient.
        Optimized with batching and retry logic for better performance and reliability.

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors
        """
        # Truncate texts to prevent token limit issues (512 tokens for MiniLM)
        # Approximate: 4 chars per token, so ~2000 chars max
        max_chars = 2000
        truncated_texts = [t[:max_chars] if len(t) > max_chars else t for t in texts]

        # Use InferenceClient which handles routing correctly
        def _embed():
            # InferenceClient.feature_extraction handles the API call correctly
            # It automatically routes to the right endpoint
            if len(truncated_texts) == 1:
                # Single text with retry
                result = self._retry_with_backoff(
                    self.client.feature_extraction, truncated_texts[0]
                )
                return (
                    [result]
                    if isinstance(result, list)
                    and len(result) > 0
                    and isinstance(result[0], (int, float))
                    else [result]
                )
            else:
                # Multiple texts - process in optimized batches to reduce API calls
                # Dynamic batch size based on total text length
                total_chars = sum(len(t) for t in truncated_texts)
                batch_size = 16 if total_chars > 20000 else 32
                embeddings = []

                for i in range(0, len(truncated_texts), batch_size):
                    batch = truncated_texts[i : i + batch_size]

                    if len(batch) == 1:
                        result = self._retry_with_backoff(
                            self.client.feature_extraction, batch[0]
                        )
                        if isinstance(result, list) and len(result) > 0:
                            if isinstance(result[0], (int, float)):
                                embeddings.append(result)
                            elif isinstance(result[0], list):
                                embeddings.append(result[0])
                        else:
                            embeddings.append(result)
                    else:
                        # Try batch processing first with retry
                        try:
                            batch_results = self._retry_with_backoff(
                                self.client.feature_extraction, batch
                            )
                            # Handle different response formats
                            if isinstance(batch_results, list):
                                for result in batch_results:
                                    if isinstance(result, list) and len(result) > 0:
                                        if isinstance(result[0], (int, float)):
                                            embeddings.append(result)
                                        elif isinstance(result[0], list):
                                            embeddings.append(result[0])
                                    else:
                                        embeddings.append(result)
                            else:
                                # Fallback: process individually with retry
                                for text in batch:
                                    result = self._retry_with_backoff(
                                        self.client.feature_extraction, text
                                    )
                                    if isinstance(result, list) and len(result) > 0:
                                        if isinstance(result[0], (int, float)):
                                            embeddings.append(result)
                                        elif isinstance(result[0], list):
                                            embeddings.append(result[0])
                                    else:
                                        embeddings.append(result)
                        except Exception:
                            # If batch fails after retries, process individually with retry
                            for text in batch:
                                result = self._retry_with_backoff(
                                    self.client.feature_extraction, text
                                )
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
