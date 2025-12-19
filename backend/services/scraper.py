import uuid
from typing import List, Dict, Any
from urllib.parse import urlparse
from firecrawl import FirecrawlApp
from config import FIRECRAWL_API_KEY


class ScraperService:
    def __init__(self):
        self.firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)

    def _extract_base_url(self, url: str) -> str:
        """Extract base URL (scheme + netloc) from a full URL."""
        try:
            parsed = urlparse(url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"
            return base_url
        except Exception:
            # Fallback: try to extract manually
            if "://" in url:
                parts = url.split("/")
                return f"{parts[0]}//{parts[2]}"
            return url

    def extract_links_from_markdown(self, markdown: str, base_url: str) -> List[str]:
        """
        Extract all links from markdown content.
        Returns list of absolute URLs found in the markdown.
        Filters to same-domain links only.
        """
        import re

        if not markdown:
            return []

        # Extract markdown links: [text](url)
        markdown_link_pattern = r"\[([^\]]+)\]\(([^\)]+)\)"
        # Extract bare URLs: http://... or https://...
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'

        links = set()

        # Find markdown-style links
        for match in re.finditer(markdown_link_pattern, markdown):
            url = match.group(2)
            if url and not url.startswith("#"):  # Skip anchor links
                links.add(url)

        # Find bare URLs
        for match in re.finditer(url_pattern, markdown):
            url = match.group(0)
            links.add(url)

        # Convert relative URLs to absolute and filter by domain
        absolute_links = []
        base_domain = urlparse(base_url).netloc

        for link in links:
            # Skip mailto, javascript, etc.
            if link.startswith(("mailto:", "javascript:", "tel:", "data:")):
                continue

            # Handle relative URLs
            if link.startswith("/"):
                absolute_url = f"{base_url.rstrip('/')}{link}"
            elif link.startswith("./"):
                absolute_url = f"{base_url.rstrip('/')}/{link[2:]}"
            elif not link.startswith(("http://", "https://")):
                # Relative URL without leading slash
                absolute_url = f"{base_url.rstrip('/')}/{link}"
            else:
                absolute_url = link

            # Filter to same domain only
            try:
                link_domain = urlparse(absolute_url).netloc
                if link_domain == base_domain:
                    absolute_links.append(absolute_url)
            except Exception:
                continue

        return list(set(absolute_links))  # Remove duplicates

    async def scrape_site(
        self, url: str, max_depth: int = 3, crawl_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Scrape a website using FireCrawl and return markdown content with unique IDs.

        Args:
            url: The URL to scrape
            max_depth: Maximum depth for crawling (default: 3)
            crawl_id: Unique crawl session ID

        Returns:
            List of dictionaries containing page_id, url, markdown, base_url, crawl_id, and metadata
        """
        base_url = self._extract_base_url(url)

        try:
            # Use multi-page crawl to get the main page + all links found on it
            # max_depth=1 means: scrape the initial page and all pages linked from it
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

            # Poll for completion with exponential backoff
            max_wait = 120  # Wait up to 120 seconds
            waited = 0
            attempt = 0
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
                    if hasattr(results, "data") and results.data:
                        for page in results.data:
                            page_id = str(uuid.uuid4())
                            page_url = getattr(page, "url", url)
                            markdown_content = self._extract_markdown_from_result(page)

                            pages.append(
                                {
                                    "page_id": page_id,
                                    "url": page_url,
                                    "base_url": base_url,
                                    "markdown": markdown_content,
                                    "crawl_id": crawl_id,
                                    "metadata": {
                                        "title": (
                                            getattr(
                                                getattr(page, "metadata", None),
                                                "title",
                                                "",
                                            )
                                            if hasattr(page, "metadata")
                                            else ""
                                        ),
                                        "description": (
                                            getattr(
                                                getattr(page, "metadata", None),
                                                "description",
                                                "",
                                            )
                                            if hasattr(page, "metadata")
                                            else ""
                                        ),
                                        "statusCode": 200,
                                    },
                                }
                            )
                        return (
                            pages
                            if pages
                            else await self._scrape_single_page(url, base_url, crawl_id)
                        )
                    elif status.status == "failed":
                        break
                    # Exponential backoff: 2s, 4s, 8s, max 15s
                    wait_time = min(2**attempt, 15)
                    await asyncio.sleep(wait_time)
                    waited += wait_time
                    attempt += 1

                # If crawl didn't complete, fall back to single page
                return await self._scrape_single_page(url, base_url, crawl_id)

        except Exception as e:
            print(f"Crawl failed, falling back to single page scrape: {str(e)}")
            # Fallback to single page scrape if crawl fails
            return await self._scrape_single_page(url, base_url, crawl_id)

    def _extract_markdown_from_result(self, result) -> str:
        """Extract markdown content from Firecrawl result, handling different response formats."""
        # Try different ways to access markdown
        if hasattr(result, "markdown"):
            markdown = result.markdown
        elif hasattr(result, "content"):
            # Sometimes content is the markdown
            markdown = result.content
        elif isinstance(result, dict):
            markdown = result.get("markdown", result.get("content", ""))
        else:
            markdown = getattr(result, "markdown", getattr(result, "content", ""))

        # Ensure it's a string and check if it's actually HTML
        markdown_str = str(markdown) if markdown else ""

        # Basic check: if it looks like HTML (contains HTML tags), log a warning
        if markdown_str.strip().startswith("<") and (
            "<html" in markdown_str.lower()
            or "<body" in markdown_str.lower()
            or "<div" in markdown_str.lower()
        ):
            print(
                f"Warning: Received HTML instead of markdown. This might indicate a Firecrawl API issue."
            )
            # Try to extract text content (basic fallback)
            # In a real scenario, you might want to use a library like html2text
            # For now, we'll return it as-is but log the issue

        return markdown_str

    async def _scrape_single_page(
        self, url: str, base_url: str, crawl_id: str = None
    ) -> List[Dict[str, Any]]:
        """Scrape a single page."""
        try:
            import asyncio

            def _scrape():
                # Use the correct method: scrape() with direct parameters
                # Request markdown format - this returns clean markdown by default
                result = self.firecrawl.scrape(url=url, formats=["markdown"])
                return result

            scrape_result = await asyncio.to_thread(_scrape)

            # Extract markdown using helper method
            markdown = self._extract_markdown_from_result(scrape_result)

            # Extract metadata
            if hasattr(scrape_result, "metadata"):
                metadata = scrape_result.metadata
            elif isinstance(scrape_result, dict):
                metadata = scrape_result.get("metadata", {})
            else:
                metadata = getattr(scrape_result, "metadata", {})

            # Ensure metadata is a dict
            if not isinstance(metadata, dict):
                metadata = {
                    "title": (
                        getattr(metadata, "title", "")
                        if hasattr(metadata, "title")
                        else ""
                    ),
                    "description": (
                        getattr(metadata, "description", "")
                        if hasattr(metadata, "description")
                        else ""
                    ),
                }

            page_id = str(uuid.uuid4())
            return [
                {
                    "page_id": page_id,
                    "url": url,
                    "base_url": base_url,
                    "markdown": markdown,
                    "crawl_id": crawl_id,
                    "metadata": {
                        "title": (
                            metadata.get("title", "")
                            if isinstance(metadata, dict)
                            else getattr(metadata, "title", "")
                        ),
                        "description": (
                            metadata.get("description", "")
                            if isinstance(metadata, dict)
                            else getattr(metadata, "description", "")
                        ),
                        "statusCode": 200,
                    },
                }
            ]
        except Exception as fallback_error:
            raise Exception(f"Scraping failed: {str(fallback_error)}")
