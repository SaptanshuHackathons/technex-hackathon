from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any


class ScrapeRequest(BaseModel):
    url: str
    max_depth: Optional[int] = 3
    crawl_id: Optional[str] = None  # If not provided, will be generated
    force_refresh: Optional[bool] = False  # Force re-scraping even if data exists


class PageInfo(BaseModel):
    page_id: str
    url: str
    base_url: Optional[str] = None
    markdown: str
    metadata: Dict[str, Any]
    crawl_id: Optional[str] = None


class ScrapeResponse(BaseModel):
    success: bool
    pages: List[PageInfo]
    crawl_id: str  # Unique ID for this crawl session
    chat_id: str  # Chat session ID created during scraping
    message: Optional[str] = None


class QueryRequest(BaseModel):
    query: str
    chat_id: str  # Required: identifies which crawl/chat session to search
    limit: Optional[int] = 5


class Source(BaseModel):
    url: str
    title: str
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]
    chat_id: str  # The chat ID used for this query
    crawl_id: Optional[str] = None  # The crawl ID associated with this chat
    metadata: Dict[str, Any]


class CreateChatRequest(BaseModel):
    crawl_id: str


# ============== Widget-specific Models ==============


class WidgetPage(BaseModel):
    """A single page to scrape for the widget."""

    url: str
    label: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None


class WidgetInitRequest(BaseModel):
    """Request to initialize or check embeddings for a widget site."""

    site_id: str  # Unique identifier for the site
    api_key: str  # Widget API key for authentication
    pages: List[WidgetPage]  # Pages to index (only used if no embeddings exist)


class WidgetInitResponse(BaseModel):
    """Response from widget initialization."""

    success: bool
    site_id: str
    has_embeddings: bool
    indexed_page_count: int
    message: str


class WidgetQueryRequest(BaseModel):
    """Query request from the widget."""

    site_id: str
    api_key: str
    query: str
    limit: Optional[int] = 5


class WidgetQueryResponse(BaseModel):
    """Query response for the widget."""

    answer: str
    sources: List[Source]
    site_id: str


class WidgetRefreshRequest(BaseModel):
    """Request to refresh embeddings for a widget site."""

    site_id: str
    api_key: str
    pages: List[WidgetPage]  # Pages to re-index


class WidgetRefreshResponse(BaseModel):
    """Response from embedding refresh."""

    success: bool
    site_id: str
    indexed_page_count: int
    message: str


class SummarizeRequest(BaseModel):
    chat_id: str  # Required: identifies which crawl/chat session to summarize


class SummarizeResponse(BaseModel):
    summary: str  # Bullet-point formatted summary
    chat_id: str
    crawl_id: Optional[str] = None
    metadata: Dict[str, Any]
