"""
Background task manager for deep web scraping.
Handles asynchronous crawling of discovered links.
"""

import asyncio
from typing import Dict, Set
from services.scraper import ScraperService
from services.embeddings import EmbeddingService
from services.vector_store import VectorStoreService
from services.database import DatabaseService
from services.chunking import ChunkingService


class BackgroundTaskManager:
    """Manages background scraping tasks using asyncio."""

    def __init__(self):
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.scraper = ScraperService()
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStoreService()
        self.db_service = DatabaseService()
        self.chunking_service = ChunkingService(chunk_size=800, chunk_overlap=200)

    async def start_deep_scrape(
        self,
        crawl_id: str,
        base_url: str,
        initial_links: list,
        max_depth: int,
        chat_id: str,
    ):
        """
        Start deep scraping background task.

        Args:
            crawl_id: The crawl session ID
            base_url: Base URL for domain filtering
            initial_links: List of links discovered from the main page
            max_depth: Maximum crawl depth
            chat_id: Associated chat ID
        """
        # Update crawl status to scraping
        self.db_service.update_crawl_status(
            crawl_id, status="scraping", current_depth=1, max_depth=max_depth
        )

        # Track all discovered URLs to avoid duplicates
        discovered_urls: Set[str] = set(initial_links)

        # Queue initial links as pending pages
        for link in initial_links:
            try:
                self.db_service.add_pending_page(
                    crawl_id=crawl_id,
                    url=link,
                    title="",  # Will be filled in when scraped
                    depth=1,
                    discovered_from_page_id=None,  # From root page
                )
            except Exception as e:
                print(f"Error adding pending page {link}: {str(e)}")

        # Update total links found
        self.db_service.update_crawl_status(crawl_id, total_links=len(discovered_urls))

        # Process pages depth by depth
        for current_depth in range(1, max_depth + 1):
            self.db_service.update_crawl_status(crawl_id, current_depth=current_depth)

            # Get pending pages at this depth
            pending_pages = self.db_service.get_pending_pages(crawl_id, limit=50)

            if not pending_pages:
                print(f"No more pending pages at depth {current_depth}")
                break

            print(
                f"Processing {len(pending_pages)} pages at depth {current_depth}/{max_depth}"
            )

            # Process pages in batches to avoid overwhelming the API
            batch_size = 5
            for i in range(0, len(pending_pages), batch_size):
                batch = pending_pages[i : i + batch_size]

                # Create tasks for concurrent scraping
                scrape_tasks = [
                    self._scrape_and_index_page(
                        page,
                        crawl_id,
                        base_url,
                        current_depth,
                        max_depth,
                        discovered_urls,
                    )
                    for page in batch
                ]

                # Wait for batch to complete
                await asyncio.gather(*scrape_tasks, return_exceptions=True)

                # Update total links count
                self.db_service.update_crawl_status(
                    crawl_id, total_links=len(discovered_urls)
                )

        # Mark crawl as completed
        self.db_service.update_crawl_status(crawl_id, status="completed")
        print(f"Deep scrape completed for crawl {crawl_id}")

    async def _scrape_and_index_page(
        self,
        page: Dict,
        crawl_id: str,
        base_url: str,
        current_depth: int,
        max_depth: int,
        discovered_urls: Set[str],
    ):
        """
        Scrape a single page, extract links, and index its content.

        Args:
            page: Page record from database
            crawl_id: Crawl session ID
            base_url: Base URL for filtering
            current_depth: Current depth level
            max_depth: Maximum depth
            discovered_urls: Set of all discovered URLs (modified in place)
        """
        page_id = page["id"]
        url = page["url"]

        try:
            # Mark as being scraped
            self.db_service.update_page_status(page_id, "scraped")

            # Scrape the page
            scraped_data = await self.scraper._scrape_single_page(
                url, base_url, crawl_id
            )

            if not scraped_data or len(scraped_data) == 0:
                self.db_service.update_page_status(page_id, "failed")
                return

            page_data = scraped_data[0]
            markdown = page_data.get("markdown", "")
            title = page_data.get("metadata", {}).get("title", url)

            # Update page with scraped title
            self.db_service.update_page_status(page_id, "scraped", {"title": title})

            # Extract links if we haven't reached max depth
            if current_depth < max_depth and markdown:
                new_links = self.scraper.extract_links_from_markdown(markdown, base_url)

                for link in new_links:
                    if link not in discovered_urls:
                        discovered_urls.add(link)
                        # Queue for next depth level
                        try:
                            self.db_service.add_pending_page(
                                crawl_id=crawl_id,
                                url=link,
                                title="",
                                depth=current_depth + 1,
                                discovered_from_page_id=page_id,
                            )
                        except Exception as e:
                            # Likely duplicate; skip
                            pass

            # Generate and store embeddings
            if markdown and len(markdown.strip()) > 0:
                try:
                    chunks = self.chunking_service.chunk_markdown(markdown)
                    if chunks:
                        # Generate embeddings for all chunks
                        chunk_texts = [chunk["text"] for chunk in chunks]
                        embeddings = await self.embedding_service.generate_embeddings(
                            chunk_texts
                        )

                        # Store embeddings
                        embeddings_batch = []
                        for idx, (chunk, embedding) in enumerate(
                            zip(chunks, embeddings)
                        ):
                            chunk_id = f"{page_id}_chunk_{idx}"
                            embeddings_batch.append(
                                {
                                    "page_id": chunk_id,
                                    "url": url,
                                    "markdown": chunk["text"],
                                    "embedding": embedding,
                                    "metadata": {
                                        **page_data.get("metadata", {}),
                                        "chunk_index": chunk["chunk_index"],
                                        "total_chunks": chunk["total_chunks"],
                                        "original_page_id": page_id,
                                        "depth": current_depth,
                                    },
                                    "crawl_id": crawl_id,
                                    "base_url": base_url,
                                }
                            )

                        # Store in vector database
                        await self.vector_store.store_embeddings_batch(embeddings_batch)

                except Exception as e:
                    print(f"Error indexing {url}: {str(e)}")

            # Mark as indexed
            self.db_service.update_page_status(page_id, "indexed")

        except Exception as e:
            print(f"Error scraping {url}: {str(e)}")
            self.db_service.update_page_status(page_id, "failed")

    def start_task(self, crawl_id: str, *args, **kwargs):
        """
        Start a background task for deep scraping.

        Args:
            crawl_id: Crawl ID to use as task identifier
            *args, **kwargs: Arguments to pass to start_deep_scrape
        """
        if crawl_id in self.active_tasks:
            print(f"Task for crawl {crawl_id} is already running")
            return

        task = asyncio.create_task(self.start_deep_scrape(crawl_id, *args, **kwargs))
        self.active_tasks[crawl_id] = task

        # Add callback to clean up when done
        task.add_done_callback(lambda t: self.active_tasks.pop(crawl_id, None))

    def cancel_task(self, crawl_id: str):
        """Cancel a running background task."""
        if crawl_id in self.active_tasks:
            self.active_tasks[crawl_id].cancel()
            self.db_service.update_crawl_status(crawl_id, status="cancelled")
            return True
        return False


# Global instance
background_task_manager = BackgroundTaskManager()
