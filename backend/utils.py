"""
Utility functions for the backend API.
"""

from urllib.parse import urlparse
from typing import List, Dict, Any


def generate_chat_name(url: str, pages_data: List[Dict[str, Any]]) -> str:
    """
    Generate a meaningful chat name from URL and page data.

    Args:
        url: The URL of the scraped website
        pages_data: List of scraped page data with metadata

    Returns:
        A clean, user-friendly chat name
    """
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "")

    # Try to get the first page title
    first_page_title = None
    if pages_data and len(pages_data) > 0:
        first_page_title = pages_data[0].get("metadata", {}).get("title", "")

    # Clean up the title
    if first_page_title:
        # Remove common suffixes (domain name from title)
        title = first_page_title
        for suffix in [" - " + domain, " | " + domain, domain]:
            if title.endswith(suffix):
                title = title[: -len(suffix)].strip()

        # Truncate if too long
        if len(title) > 50:
            title = title[:47] + "..."

        return title if title else domain

    return domain
