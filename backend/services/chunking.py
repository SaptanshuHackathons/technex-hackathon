"""
Text chunking service for splitting markdown content into smaller, manageable chunks.
Optimized with semantic splitting on sentence boundaries.
"""

from typing import List, Dict, Any
import re


class ChunkingService:
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 200):
        """
        Initialize chunking service.

        Args:
            chunk_size: Target size for each chunk in characters
            chunk_overlap: Number of characters to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        # Sentence-ending pattern for better splits
        self._sentence_end_pattern = re.compile(r"(?<=[.!?])\s+(?=[A-Z])")

    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences while preserving structure."""
        # Handle common abbreviations that shouldn't split
        protected = (
            text.replace("Mr.", "Mr<DOT>")
            .replace("Mrs.", "Mrs<DOT>")
            .replace("Dr.", "Dr<DOT>")
        )
        protected = protected.replace("e.g.", "e<DOT>g<DOT>").replace(
            "i.e.", "i<DOT>e<DOT>"
        )
        protected = protected.replace("etc.", "etc<DOT>")

        # Split on sentence boundaries
        sentences = self._sentence_end_pattern.split(protected)

        # Restore dots
        sentences = [s.replace("<DOT>", ".") for s in sentences]
        return [s.strip() for s in sentences if s.strip()]

    def _find_sentence_boundary_overlap(self, text: str, target_length: int) -> str:
        """Find the best overlap that starts at a sentence boundary."""
        if len(text) <= target_length:
            return text

        # Get the last target_length characters
        overlap_region = text[-target_length:]

        # Find sentence boundaries in this region
        sentences = self._split_into_sentences(overlap_region)

        if len(sentences) <= 1:
            # No sentence boundary found, use last complete sentence
            return overlap_region

        # Skip first (potentially incomplete) sentence, use rest
        return " ".join(sentences[1:])

    def chunk_text(self, text: str, min_chunk_size: int = 200) -> List[str]:
        """
        Split text into chunks with overlap at sentence boundaries.

        Args:
            text: Text to chunk
            min_chunk_size: Minimum size for a chunk (smaller chunks are discarded)

        Returns:
            List of text chunks
        """
        if not text or len(text.strip()) == 0:
            return []

        # Detect content type for dynamic overlap
        has_code = "\n```" in text or "\n    " in text
        dynamic_overlap = (
            int(self.chunk_overlap * 1.5) if has_code else self.chunk_overlap
        )

        # Try to split on paragraphs first (double newlines)
        paragraphs = re.split(r"\n\n+", text)

        chunks = []
        current_chunk = ""

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            # If adding this paragraph would exceed chunk size
            if (
                current_chunk
                and len(current_chunk) + len(paragraph) + 2 > self.chunk_size
            ):
                # Save current chunk
                if len(current_chunk) >= min_chunk_size:
                    chunks.append(current_chunk.strip())

                # Start new chunk with overlap at sentence boundary
                if dynamic_overlap > 0 and current_chunk:
                    overlap_text = self._find_sentence_boundary_overlap(
                        current_chunk, dynamic_overlap
                    )
                    current_chunk = paragraph
            else:
                # Add paragraph to current chunk
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph

        # Add the last chunk if it's large enough
        if current_chunk and len(current_chunk.strip()) >= min_chunk_size:
            chunks.append(current_chunk.strip())

        # If no chunks were created (text was too short), return the whole text
        if not chunks and text.strip():
            chunks = [text.strip()]

        return chunks

    def chunk_markdown(self, markdown: str) -> List[Dict[str, Any]]:
        """
        Chunk markdown text and return chunks with metadata.

        Args:
            markdown: Markdown text to chunk

        Returns:
            List of dictionaries with 'text' and 'chunk_index' keys
        """
        chunks = self.chunk_text(markdown)

        result = []
        for idx, chunk_text in enumerate(chunks):
            result.append(
                {"text": chunk_text, "chunk_index": idx, "total_chunks": len(chunks)}
            )

        return result
