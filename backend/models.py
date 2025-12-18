from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any


class ScrapeRequest(BaseModel):
    url: str
    max_depth: Optional[int] = 3


class PageInfo(BaseModel):
    page_id: str
    url: str
    markdown: str
    metadata: Dict[str, Any]


class ScrapeResponse(BaseModel):
    success: bool
    pages: List[PageInfo]
    message: Optional[str] = None


class QueryRequest(BaseModel):
    query: str
    limit: Optional[int] = 5


class Source(BaseModel):
    url: str
    title: str
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]
    metadata: Dict[str, Any]


