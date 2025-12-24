"""
Database models for Canner application using MongoDB
"""

from typing import Any, Dict, List


class Response:
    """Model representing a saved response."""

    def __init__(
        self,
        id: str,
        title: str,
        content: str,
        tags: List[str] = None,
        created_at: str = None,
        updated_at: str = None,
    ):
        self.id = id
        self.title = title
        self.content = content
        self.tags = tags or []
        self.created_at = created_at
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary."""
        return {
            "id": str(self.id),
            "title": self.title,
            "content": self.content,
            "tags": self.tags,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @staticmethod
    def from_db_row(doc: Dict[str, Any]) -> "Response":
        """Create Response from MongoDB document.
        
        Args:
            doc: MongoDB document from collection
        """
        # MongoDB uses _id (ObjectId) instead of id (UUID)
        # Tags are already a list in MongoDB
        tags = doc.get("tags", [])
        if tags is None:
            tags = []
            
        return Response(
            id=str(doc["_id"]),  # ObjectId to string
            title=doc["title"],
            content=doc["content"],
            tags=tags,
            created_at=doc["created_at"].isoformat() if doc.get("created_at") else None,
            updated_at=doc["updated_at"].isoformat() if doc.get("updated_at") else None,
        )
