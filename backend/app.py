import logging
import os
import time
from datetime import datetime
from typing import Any, Dict

from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

app = Flask(__name__)
CORS(app)



def get_db_connection(max_retries: int = 5, base_delay: float = 1.0):
    """Create a MongoDB database connection with automatic retry logic.

    Args:
        max_retries: Maximum number of connection attempts
        base_delay: Base delay between retries (exponential backoff)
        
    Returns:
        MongoDB database instance
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is required")
    db_name = os.getenv("MONGODB_DB_NAME", "cannerai_db")

    # MongoDB connection with retry logic
    for attempt in range(max_retries + 1):
        try:
            client = MongoClient(db_url, serverSelectionTimeoutMS=5000)
            
            # Test the connection
            client.admin.command('ping')
            
            # Get the database
            db = client[db_name]

            if attempt > 0:
                logging.info(
                    f"✅ MongoDB connection established after {attempt} retries"
                )
            return db

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            if attempt == max_retries:
                logging.error(
                    f"❌ Failed to connect to MongoDB after {max_retries} attempts: {e}"
                )
                raise

            delay = base_delay * (2**attempt)  # Exponential backoff
            logging.warning(
                f"⚠️  MongoDB connection attempt {attempt + 1} failed, retrying in {delay}s: {e}"
            )
            time.sleep(delay)


def init_db(max_retries: int = 10):
    """Initialize the database with required collections and indexes.

    Args:
        max_retries: Maximum number of initialization attempts
    """
    for attempt in range(max_retries + 1):
        try:
            db = get_db_connection()

            # Ensure canned_responses collection exists
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

            if attempt > 0:
                logging.info(
                    f"✅ Database initialized (MongoDB) after {attempt} retries"
                )
            else:
                logging.info("✅ Database initialized (MongoDB)")
            return

        except Exception as e:
            if attempt == max_retries:
                logging.error(
                    f"❌ Failed to initialize database after {max_retries} attempts: {e}"
                )
                raise

            delay = 2**attempt  # Exponential backoff
            logging.warning(
                f"⚠️  Database initialization attempt {attempt + 1} failed, retrying in {delay}s: {e}"
            )
            time.sleep(delay)


def dict_from_doc(doc) -> Dict[str, Any]:
    """Convert a MongoDB document to a dictionary."""
    tags = doc.get("tags", [])
    if tags is None:
        tags = []

    return {
        "id": str(doc["_id"]),  # ObjectId to string for JSON
        "title": doc["title"],
        "content": doc["content"],
        "tags": tags,
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
        "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else None,
    }


@app.route("/api/responses", methods=["GET"])
def get_responses():
    """Get all responses, optionally filtered by search query."""
    search = request.args.get("search", "")

    db = get_db_connection()
    collection = db['canned_responses']

    if search:
        # MongoDB text search or regex for partial matching
        try:
            # Try text search first (faster with index)
            query = {'$text': {'$search': search}}
            cursor = collection.find(query).sort('created_at', DESCENDING)
            responses = [dict_from_doc(doc) for doc in cursor]
        except Exception:
            # Fallback to regex if text index not available
            query = {
                '$or': [
                    {'title': {'$regex': search, '$options': 'i'}},
                    {'content': {'$regex': search, '$options': 'i'}},
                    {'tags': {'$regex': search, '$options': 'i'}}
                ]
            }
            cursor = collection.find(query).sort('created_at', DESCENDING)
            responses = [dict_from_doc(doc) for doc in cursor]
    else:
        cursor = collection.find().sort('created_at', DESCENDING)
        responses = [dict_from_doc(doc) for doc in cursor]

    return jsonify(responses)


@app.route("/api/responses/<response_id>", methods=["GET"])
def get_response(response_id: str):
    """Get a single response by ID."""
    db = get_db_connection()
    collection = db['canned_responses']

    try:
        doc = collection.find_one({'_id': ObjectId(response_id)})
    except Exception:
        return jsonify({"error": "Invalid response ID"}), 400

    if not doc:
        return jsonify({"error": "Response not found"}), 404

    return jsonify(dict_from_doc(doc))


@app.route("/api/responses", methods=["POST"])
def create_response():
    """Create a new response."""
    data = request.get_json()

    if not data or "title" not in data or "content" not in data:
        return jsonify({"error": "Title and content are required"}), 400

    title = data["title"]
    content = data["content"]
    tags = data.get("tags", [])

    db = get_db_connection()
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

    return jsonify(dict_from_doc(doc)), 201


@app.route("/api/responses/<response_id>", methods=["PATCH"])
def update_response(response_id: str):
    """Update an existing response (partial update)."""
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    db = get_db_connection()
    collection = db['canned_responses']

    try:
        object_id = ObjectId(response_id)
    except Exception:
        return jsonify({"error": "Invalid response ID"}), 400

    # Check if response exists
    existing = collection.find_one({'_id': object_id})
    
    if not existing:
        return jsonify({"error": "Response not found"}), 404

    # Build update document
    update_fields = {'updated_at': datetime.utcnow()}

    if "title" in data:
        update_fields['title'] = data["title"]

    if "content" in data:
        update_fields['content'] = data["content"]

    if "tags" in data:
        update_fields['tags'] = data["tags"]

    # Update the document
    collection.update_one(
        {'_id': object_id},
        {'$set': update_fields}
    )
    
    # Fetch updated document
    doc = collection.find_one({'_id': object_id})

    return jsonify(dict_from_doc(doc))


@app.route("/api/responses/<response_id>", methods=["DELETE"])
def delete_response(response_id: str):
    """Delete a response."""
    db = get_db_connection()
    collection = db['canned_responses']

    try:
        object_id = ObjectId(response_id)
    except Exception:
        return jsonify({"error": "Invalid response ID"}), 400

    result = collection.delete_one({'_id': object_id})
    
    if result.deleted_count == 0:
        return jsonify({"error": "Response not found"}), 404

    return "", 204


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint with database connectivity test."""
    try:
        # Test database connection
        db = get_db_connection(max_retries=1)  # Quick test, don't wait long
        db.command('ping')

        return jsonify(
            {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "database": "MongoDB",
                "database_connected": True,
            }
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "timestamp": datetime.now().isoformat(),
                    "database": "MongoDB",
                    "database_connected": False,
                    "error": str(e),
                }
            ),
            503,
        )


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    # Show which database we're using
    db_url = os.getenv("DATABASE_URL", "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0")
    db_name = os.getenv("MONGODB_DB_NAME", "cannerai_db")
    # Mask password in logs for security
    safe_url = db_url.split('@')[0].split(':')[0:2] if '@' in db_url else db_url
    logging.info(f"🔧 Using MongoDB Atlas cluster")
    logging.info(f"🔧 Database: {db_name}")

    try:
        # Initialize database with retry logic
        logging.info("🔄 Initializing database...")
        init_db()

        logging.info("🚀 Starting Flask server on http://0.0.0.0:5000")
        app.run(debug=True, host="0.0.0.0", port=5000)

    except Exception as e:
        logging.error(f"❌ Failed to start application: {e}")
        exit(1)
