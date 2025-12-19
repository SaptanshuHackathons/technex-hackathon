import asyncio
import random
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from config import GOOGLE_API_KEY, GEMINI_MODEL


class RAGService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL, google_api_key=GOOGLE_API_KEY, temperature=0.7
        )
        # Retry configuration
        self.max_retries = 3
        self.base_delay = 1.0
        self.max_delay = 10.0
    
    async def _invoke_with_retry(self, messages) -> Any:
        """Invoke LLM with exponential backoff retry logic."""
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                return await self.llm.ainvoke(messages)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    # Exponential backoff with jitter
                    delay = min(self.base_delay * (2 ** attempt) + random.uniform(0, 1), self.max_delay)
                    print(f"Gemini API attempt {attempt + 1} failed: {str(e)}. Retrying in {delay:.1f}s...")
                    await asyncio.sleep(delay)
        raise last_exception

    async def generate_response(
        self, query: str, context_documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate a response using RAG with retrieved context.

        Args:
            query: User query
            context_documents: List of relevant documents from vector search

        Returns:
            Dictionary with answer, sources, and metadata
        """
        try:
            # Build context from retrieved documents (use full chunk content, not truncated)
            context_parts = []
            seen_urls = set()
            sources_map = {}  # Map source number to URL

            for i, doc in enumerate(context_documents):
                url = doc.get("url", "")
                title = doc.get("title", "")
                sources_map[i + 1] = {"url": url, "title": title}

                # Include chunk index if available
                chunk_info = ""
                doc_metadata = doc.get("metadata", {})
                if doc_metadata and doc_metadata.get("chunk_index") is not None:
                    chunk_idx = doc_metadata.get("chunk_index", 0) + 1
                    total_chunks = doc_metadata.get("total_chunks", "?")
                    chunk_info = f" (Chunk {chunk_idx} of {total_chunks})"

                # Use full markdown content (chunks are already appropriately sized)
                markdown_content = doc.get("markdown", "")
                # Limit to 2000 chars per chunk to avoid token limits, but this should rarely be needed
                if len(markdown_content) > 2000:
                    markdown_content = markdown_content[:2000] + "..."

                context_parts.append(
                    f"Source {i+1}{chunk_info} (URL: {url}):\n{markdown_content}"
                )
                seen_urls.add(url)

            context = "\n\n---\n\n".join(context_parts)

            # Create prompt
            prompt = ChatPromptTemplate.from_messages(
                [
                    SystemMessage(
                        content="""You are a helpful assistant that answers questions based on the provided context.
                Use only the information from the context to answer the question. If the context doesn't contain enough
                information to answer the question, say so. 
                
                IMPORTANT: When referencing information, cite sources using the exact format "(Source N)" where N is the source number.
                For example: "Regular expressions are useful for pattern matching (Source 1)." or "HTML parsing is complex (Source 2, Source 3)."
                Always use parentheses around source citations."""
                    ),
                    HumanMessage(
                        content=f"""Context:
{context}

Question: {query}

Please provide a comprehensive answer based on the context above. When referencing information, cite the specific source numbers in parentheses like (Source 1) or (Source 2, Source 3)."""
                    ),
                ]
            )

            # Generate response with retry
            messages = prompt.format_messages()
            response = await self._invoke_with_retry(messages)

            # Post-process the response to convert source citations to markdown links
            answer = response.content
            import re

            # Pattern to match (Source N) or (Source N, Source M)
            def replace_source(match):
                citation = match.group(0)
                # Extract all source numbers from the citation
                source_numbers = re.findall(r"Source (\d+)", citation)

                links = []
                for num_str in source_numbers:
                    num = int(num_str)
                    if num in sources_map:
                        source_info = sources_map[num]
                        url = source_info["url"]
                        title = source_info["title"]
                        
                        # Use title if available, otherwise extract from URL
                        if title and title.strip():
                            link_text = title.strip()
                            # Limit title length for readability
                            if len(link_text) > 60:
                                link_text = link_text[:57] + "..."
                        else:
                            # Extract meaningful part from URL (path or domain)
                            from urllib.parse import urlparse
                            parsed = urlparse(url)
                            path = parsed.path.strip("/")
                            if path:
                                # Use last part of path
                                link_text = path.split("/")[-1].replace("-", " ").replace("_", " ").title()
                                if len(link_text) > 60:
                                    link_text = link_text[:57] + "..."
                            else:
                                link_text = parsed.netloc or f"Source {num}"
                        
                        # Create markdown link with descriptive text
                        links.append(f"[{link_text}]({url})")

                if links:
                    return "(" + ", ".join(links) + ")"
                return citation

            # Replace all source citations with hyperlinks
            answer = re.sub(
                r"\(Source \d+(?:,\s*Source \d+)*\)", replace_source, answer
            )

            # Extract sources
            sources = [
                {
                    "url": doc["url"],
                    "title": doc.get("title", ""),
                    "score": doc.get("score", 0),
                }
                for doc in context_documents
            ]

            return {
                "answer": answer,
                "sources": sources,
                "metadata": {
                    "model": GEMINI_MODEL,
                    "context_documents_count": len(context_documents),
                },
            }

        except Exception as e:
            raise Exception(f"RAG response generation failed: {str(e)}")

    async def generate_content_summary(
        self,
        pages_data: List[Dict[str, Any]],
        domain: str,
        max_pages_to_analyze: int = 5,
    ) -> str:
        """
        Generate an AI-powered summary of scraped content.

        Args:
            pages_data: List of scraped page data
            domain: Domain name of the website
            max_pages_to_analyze: Number of pages to analyze for summary

        Returns:
            AI-generated summary as a string
        """
        try:
            # Get sample content from the first few pages
            pages_to_analyze = pages_data[:max_pages_to_analyze]

            # Build content overview
            content_parts = []
            for idx, page in enumerate(pages_to_analyze):
                title = page.get("metadata", {}).get("title", "Untitled")
                markdown = page.get("markdown", "")
                # Limit content to first 1500 chars per page for summary
                preview = markdown[:1500] + "..." if len(markdown) > 1500 else markdown
                content_parts.append(f"Page {idx + 1}: {title}\n{preview}")

            content_overview = "\n\n---\n\n".join(content_parts)

            # Get all page titles for comprehensive listing
            all_titles = [
                p.get("metadata", {}).get("title", "Untitled") for p in pages_data
            ]

            prompt = f"""Based on the following scraped web content from {domain}, generate a professional summary (2-3 paragraphs) that describes:
1. The main topics and themes covered across the pages
2. The type of information available (educational, technical documentation, news, etc.)
3. What a user can learn or discover from this content

Website: {domain}
Total pages indexed: {len(pages_data)}

Sample content from first {len(pages_to_analyze)} pages:
{content_overview}

All page titles: {', '.join(all_titles[:10])}{"..." if len(all_titles) > 10 else ""}

Generate a clear, informative summary that helps users understand what knowledge is available in this indexed content. Be professional and concise."""

            messages = [
                SystemMessage(
                    content="You are a professional content analyst that creates clear, informative summaries of web content."
                ),
                HumanMessage(content=prompt),
            ]

            response = await self._invoke_with_retry(messages)
            return response.content

        except Exception as e:
            print(f"Error generating content summary: {str(e)}")
            # Return a basic summary as fallback
            return f"Successfully indexed {len(pages_data)} pages from {domain}. The content is now available for questions and analysis."
