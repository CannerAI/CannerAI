"""
Database models and initialization for Response Saver
"""

import json
from typing import List, Dict, Any, Optional
import sqlite3

DATABASE = "responses.db"


class Response:
    """Model representing a saved response."""
    
    def __init__(self, id: str, title: str, content: str, 
                 tags: Optional[List[str]] = None, user_id: Optional[str] = None,
                 created_at: Optional[str] = None, updated_at: Optional[str] = None):
        self.id = id
        self.title = title
        self.content = content
        self.tags = tags or []
        self.user_id = user_id
        self.created_at = created_at
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'tags': self.tags,
            'user_id': self.user_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @staticmethod
    def from_db_row(row: sqlite3.Row) -> "Response":
        """Create Response from database row."""
        return Response(
            id=row['id'],
            title=row['title'],
            content=row['content'],
            tags=json.loads(row['tags']) if row['tags'] else [],
            user_id=row['user_id'] if 'user_id' in row.keys() else None,
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )


class User:
    """Model representing a user."""
    
    def __init__(self, id: str, email: str, name: str, provider: str, 
                 provider_id: str, avatar_url: Optional[str] = None, 
                 created_at: Optional[str] = None, updated_at: Optional[str] = None):
        self.id = id
        self.email = email
        self.name = name
        self.provider = provider  # 'google' or 'github'
        self.provider_id = provider_id
        self.avatar_url = avatar_url
        self.created_at = created_at
        self.updated_at = updated_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'provider': self.provider,
            'provider_id': self.provider_id,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_db_row(row: sqlite3.Row) -> 'User':
        """Create User from database row."""
        return User(
            id=row['id'],
            email=row['email'],
            name=row['name'],
            provider=row['provider'],
            provider_id=row['provider_id'],
            avatar_url=row['avatar_url'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )