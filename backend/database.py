"""
Database service for managing responses using MongoDB
"""

import logging
import os
import time
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from models import Response


class DatabaseService:
    """Service for database operations with MongoDB."""

    @staticmethod
    def get_connection(max_retries: int = 5, base_delay: float = 1.0):
        """Get MongoDB database connection with retry logic.
        
        Args:
            max_retries: Maximum number of connection attempts
            base_delay: Base delay between retries (exponential backoff)
            
        Returns:
            MongoDB database instance
        """
        db_url = os.getenv("DATABASE_URL", "mongodb+srv://souradip1000_db_user:UuMUS8w3ioNgGnaT@cluster0.ntltgfz.mongodb.net/?appName=Cluster0")
        db_name = os.getenv("MONGODB_DB_NAME", "cannerai_db")
        
        for attempt in range(max_retries + 1):
            try:
                client = MongoClient(db_url, serverSelectionTimeoutMS=5000)
                
                # Test the connection
                client.admin.command('ping')
                
                # Get the database
                db = client[db_name]
                
                if attempt > 0:
                    logging.info(f"✅ MongoDB connection established after {attempt} retries")
                return db
                
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                if attempt == max_retries:
                    logging.error(f"❌ Failed to connect to MongoDB after {max_retries} attempts: {e}")
                    raise
                
                delay = base_delay * (2 ** attempt)  # Exponential backoff
                logging.warning(f"⚠️  MongoDB connection attempt {attempt + 1} failed, retrying in {delay}s: {e}")
                time.sleep(delay)

    @staticmethod
    def initialize():
        """Initialize database collections and indexes.
        
        Note: Collections and indexes are typically created via init.js
        This method verifies connectivity and ensures indexes exist.
        """
        db = DatabaseService.get_connection()
        
        # Verify the canned_responses collection exists
        if 'canned_responses' not in db.list_collection_names():
            db.create_collection('canned_responses')
        
        # Ensure indexes exist
        collection = db['canned_responses']
        
        # Text index for full-text search
        try:
            collection.create_index(
                [('title', TEXT), ('content', TEXT)],
                name='idx_canned_responses_text_search',
                weights={'title': 2, 'content': 1},
                default_language='english'
            )
        except Exception:
            pass  # Index might already exist
        
        # Other indexes
        collection.create_index([('tags', ASCENDING)], name='idx_canned_responses_tags', background=True)
        collection.create_index([('created_at', DESCENDING)], name='idx_canned_responses_created_at', background=True)
        collection.create_index([('updated_at', DESCENDING)], name='idx_canned_responses_updated_at', background=True)
        
        logging.info("✅ Database schema verified")

    @staticmethod
    def get_all_responses(search: Optional[str] = None) -> List[Response]:
        """Get all responses, optionally filtered."""
        db = DatabaseService.get_connection()
        collection = db['canned_responses']

        if search:
            # MongoDB text search or regex for partial matching
            # Using $text for full-text search on indexed fields
            try:
                query = {'$text': {'$search': search}}
                cursor = collection.find(query).sort('created_at', DESCENDING)
            except Exception:
                # Fallback to regex if text index not available or search is too specific
                query = {
                    '$or': [
                        {'title': {'$regex': search, '$options': 'i'}},
                        {'content': {'$regex': search, '$options': 'i'}},
                        {'tags': {'$regex': search, '$options': 'i'}}
                    ]
                }
                cursor = collection.find(query).sort('created_at', DESCENDING)
        else:
            cursor = collection.find().sort('created_at', DESCENDING)

        return [Response.from_db_row(doc) for doc in cursor]

    @staticmethod
    def get_response_by_id(response_id: str) -> Optional[Response]:
        """Get a response by ID."""
        db = DatabaseService.get_connection()
        collection = db['canned_responses']
        
        try:
            doc = collection.find_one({'_id': ObjectId(response_id)})
        except Exception:
            # Invalid ObjectId format
            return None

        if doc is None:
            return None

        return Response.from_db_row(doc)

    @staticmethod
    def create_response(title: str, content: str, tags: List[str]) -> Response:
        """Create a new response.
        
        Note: MongoDB auto-generates ObjectId
        """
        db = DatabaseService.get_connection()
        collection = db['canned_responses']

        now = datetime.utcnow()
        doc = {
            'title': title,
            'content': content,
            'tags': tags,
            'created_at': now,
            'updated_at': now
        }
        
        result = collection.insert_one(doc)
        doc['_id'] = result.inserted_id
        
        return Response.from_db_row(doc)

    @staticmethod
    def update_response(
        response_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Optional[Response]:
        """Update an existing response."""
        db = DatabaseService.get_connection()
        collection = db['canned_responses']

        try:
            object_id = ObjectId(response_id)
        except Exception:
            return None

        # Check if exists
        doc = collection.find_one({'_id': object_id})
        
        if doc is None:
            return None

        # Build update document
        update_fields = {'updated_at': datetime.utcnow()}

        if title is not None:
            update_fields['title'] = title

        if content is not None:
            update_fields['content'] = content

        if tags is not None:
            update_fields['tags'] = tags

        # Update the document
        collection.update_one(
            {'_id': object_id},
            {'$set': update_fields}
        )
        
        # Fetch updated document
        doc = collection.find_one({'_id': object_id})

        return Response.from_db_row(doc) if doc else None

    @staticmethod
    def delete_response(response_id: str) -> bool:
        """Delete a response."""
        db = DatabaseService.get_connection()
        collection = db['canned_responses']

        try:
            object_id = ObjectId(response_id)
        except Exception:
            return False

        result = collection.delete_one({'_id': object_id})
        
        return result.deleted_count > 0
