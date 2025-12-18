import uuid
from typing import List, Dict, Any
from firecrawl import FirecrawlApp
from config import FIRECRAWL_API_KEY


class ScraperService:
    def __init__(self):
        self.firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
    
    async def scrape_site(self, url: str, max_depth: int = 3) -> List[Dict[str, Any]]:
        """
        Scrape a website using FireCrawl and return markdown content with unique IDs.
        
        Args:
            url: The URL to scrape
            max_depth: Maximum depth for crawling (default: 3)
            
        Returns:
            List of dictionaries containing page_id, url, markdown, and metadata
        """
        try:
            # For now, use single page scrape
            # Multi-page crawling requires async job polling which is more complex
            # You can implement full crawling later using start_crawl() and polling
            if max_depth > 1:
                # Try to start a crawl job for multi-page
                import asyncio
                
                def _start_crawl():
                    from firecrawl.v2.types import ScrapeOptions
                    return self.firecrawl.start_crawl(
                        url=url,
                        scrape_options=ScrapeOptions(formats=["markdown"]),
                        max_discovery_depth=max_depth,
                        limit=100,
                    )
                
                crawl_job = await asyncio.to_thread(_start_crawl)
                
                # Poll for completion (simplified - you might want to implement proper polling)
                import time
                max_wait = 60  # Wait up to 60 seconds
                waited = 0
                while waited < max_wait:
                    status = await asyncio.to_thread(
                        lambda: self.firecrawl.get_crawl_status(crawl_job.job_id)
                    )
                    if status.status == "completed":
                        # Get the results
                        results = await asyncio.to_thread(
                            lambda: self.firecrawl.get_crawl_status(crawl_job.job_id)
                        )
                        pages = []
                        if hasattr(results, 'data') and results.data:
                            for page in results.data:
                                page_id = str(uuid.uuid4())
                                pages.append({
                                    "page_id": page_id,
                                    "url": getattr(page, 'url', url),
                                    "markdown": getattr(page, 'markdown', ''),
                                    "metadata": {
                                        "title": getattr(getattr(page, 'metadata', None), 'title', '') if hasattr(page, 'metadata') else '',
                                        "description": getattr(getattr(page, 'metadata', None), 'description', '') if hasattr(page, 'metadata') else '',
                                        "statusCode": 200,
                                    }
                                })
                        return pages if pages else await self._scrape_single_page(url)
                    elif status.status == "failed":
                        break
                    await asyncio.sleep(2)
                    waited += 2
                
                # If crawl didn't complete, fall back to single page
                return await self._scrape_single_page(url)
            else:
                # Single page scrape
                return await self._scrape_single_page(url)
            
        except Exception as e:
            # Fallback to single page scrape if crawl fails
            return await self._scrape_single_page(url)
    
    async def _scrape_single_page(self, url: str) -> List[Dict[str, Any]]:
        """Scrape a single page."""
        try:
            import asyncio
            
            def _scrape():
                # Use the correct method: scrape() with direct parameters
                # formats is a direct parameter, not inside params
                result = self.firecrawl.scrape(
                    url=url,
                    formats=["markdown"]
                )
                return result
            
            scrape_result = await asyncio.to_thread(_scrape)
            
            # Handle the result - it might be a Document object
            if hasattr(scrape_result, 'markdown'):
                markdown = scrape_result.markdown
                metadata = scrape_result.metadata if hasattr(scrape_result, 'metadata') else {}
            elif isinstance(scrape_result, dict):
                markdown = scrape_result.get("markdown", "")
                metadata = scrape_result.get("metadata", {})
            else:
                # Try to access as object attributes
                markdown = getattr(scrape_result, 'markdown', '')
                metadata = getattr(scrape_result, 'metadata', {})
            
            page_id = str(uuid.uuid4())
            return [{
                "page_id": page_id,
                "url": url,
                "markdown": markdown if isinstance(markdown, str) else str(markdown),
                "metadata": {
                    "title": metadata.get("title", "") if isinstance(metadata, dict) else getattr(metadata, 'title', ''),
                    "description": metadata.get("description", "") if isinstance(metadata, dict) else getattr(metadata, 'description', ''),
                    "statusCode": 200,
                }
            }]
        except Exception as fallback_error:
            raise Exception(f"Scraping failed: {str(fallback_error)}")

