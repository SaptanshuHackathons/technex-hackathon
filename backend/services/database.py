"""
Simple database service for storing crawl and chat metadata.
Uses JSON file for persistence. Can be replaced with a real database later.
"""
import json
import uuid
from typing import Dict, Optional, Any
from datetime import datetime
import os


class DatabaseService:
    def __init__(self, db_file: str = "crawl_chat_db.json"):
        self.db_file = db_file
        self.crawls: Dict[str, Dict[str, Any]] = {}
        self.chats: Dict[str, Dict[str, Any]] = {}  # chat_id -> crawl_id mapping
        self._load_db()
    
    def _load_db(self):
        """Load database from JSON file if it exists."""
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, 'r') as f:
                    data = json.load(f)
                    self.crawls = data.get("crawls", {})
                    self.chats = data.get("chats", {})
            except Exception as e:
                print(f"Warning: Could not load database: {str(e)}")
                self.crawls = {}
                self.chats = {}
    
    def _save_db(self):
        """Save database to JSON file."""
        try:
            with open(self.db_file, 'w') as f:
                json.dump({
                    "crawls": self.crawls,
                    "chats": self.chats
                }, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save database: {str(e)}")
    
    def create_crawl(self, url: str, crawl_id: Optional[str] = None) -> str:
        """
        Create a new crawl session.
        
        Args:
            url: The URL being crawled
            crawl_id: Optional crawl ID (if not provided, will be generated)
            
        Returns:
            The crawl_id
        """
        if crawl_id is None:
            crawl_id = str(uuid.uuid4())
        
        self.crawls[crawl_id] = {
            "crawl_id": crawl_id,
            "url": url,
            "created_at": datetime.now().isoformat(),
            "page_count": 0
        }
        self._save_db()
        return crawl_id
    
    def update_crawl_page_count(self, crawl_id: str, count: int):
        """Update the page count for a crawl."""
        if crawl_id in self.crawls:
            self.crawls[crawl_id]["page_count"] = count
            self._save_db()
    
    def get_crawl(self, crawl_id: str) -> Optional[Dict[str, Any]]:
        """Get crawl metadata by crawl_id."""
        return self.crawls.get(crawl_id)
    
    def create_chat(self, crawl_id: str, chat_id: Optional[str] = None) -> str:
        """
        Create a new chat session linked to a crawl.
        
        Args:
            crawl_id: The crawl ID this chat is associated with
            chat_id: Optional chat ID (if not provided, will be generated)
            
        Returns:
            The chat_id
        """
        if chat_id is None:
            chat_id = str(uuid.uuid4())
        
        self.chats[chat_id] = {
            "chat_id": chat_id,
            "crawl_id": crawl_id,
            "created_at": datetime.now().isoformat()
        }
        self._save_db()
        return chat_id
    
    def get_chat(self, chat_id: str) -> Optional[Dict[str, Any]]:
        """Get chat metadata by chat_id."""
        return self.chats.get(chat_id)
    
    def get_crawl_id_from_chat_id(self, chat_id: str) -> Optional[str]:
        """Get the crawl_id associated with a chat_id."""
        chat = self.get_chat(chat_id)
        if chat:
            return chat.get("crawl_id")
        return None
    
    def list_crawls(self) -> list[Dict[str, Any]]:
        """List all crawls."""
        return list(self.crawls.values())
    
    def list_chats(self) -> list[Dict[str, Any]]:
        """List all chats."""
        return list(self.chats.values())

