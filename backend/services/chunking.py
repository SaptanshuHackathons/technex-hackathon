"""
Text chunking service for splitting markdown content into smaller, manageable chunks.
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
    
    def chunk_text(self, text: str, min_chunk_size: int = 200) -> List[str]:
        """
        Split text into chunks with overlap.
        
        Args:
            text: Text to chunk
            min_chunk_size: Minimum size for a chunk (smaller chunks are discarded)
            
        Returns:
            List of text chunks
        """
        if not text or len(text.strip()) == 0:
            return []
        
        # Try to split on paragraphs first (double newlines)
        paragraphs = re.split(r'\n\n+', text)
        
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            # If adding this paragraph would exceed chunk size
            if current_chunk and len(current_chunk) + len(paragraph) + 2 > self.chunk_size:
                # Save current chunk
                if len(current_chunk) >= min_chunk_size:
                    chunks.append(current_chunk.strip())
                
                # Start new chunk with overlap
                if self.chunk_overlap > 0 and current_chunk:
                    # Take last chunk_overlap characters from previous chunk
                    overlap_text = current_chunk[-self.chunk_overlap:]
                    # Try to start from a sentence boundary
                    sentences = re.split(r'([.!?]\s+)', overlap_text)
                    if len(sentences) > 2:
                        overlap_text = ''.join(sentences[-2:])
                    current_chunk = overlap_text + "\n\n" + paragraph
                else:
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
            result.append({
                "text": chunk_text,
                "chunk_index": idx,
                "total_chunks": len(chunks)
            })
        
        return result

