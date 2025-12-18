from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any


class ScrapeRequest(BaseModel):
    url: str
    max_depth: Optional[int] = 3
    crawl_id: Optional[str] = None  # If not provided, will be generated


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


