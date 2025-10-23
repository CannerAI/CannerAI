from flask import Flask, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from flasgger import Swagger
import sqlite3
import json
import os
import time
from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional, Union
from urllib.parse import urlparse
import logging
from dotenv import load_dotenv
from auth import init_oauth, authenticate_user
from database import DatabaseService
from middleware import require_auth, get_current_user_id
from models import Profile

# Load environment variables
load_dotenv()

# Try to import PostgreSQL driver
try:
    import psycopg2
    import psycopg2.extras
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    print("⚠️  psycopg2 not available. PostgreSQL support disabled.")

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'fallback-secret-key-change-in-production')
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True

# Configure CORS to allow credentials from known origins
allowed_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, supports_credentials=True, origins=[o.strip() for o in allowed_origins])

# Initialize OAuth
oauth = init_oauth(app)
print(f"OAuth initialized: {oauth is not None}")
if oauth:
    try:
        google_client = oauth.create_client('google')
        print(f"Google OAuth client available: {google_client is not None}")
    except Exception as e:
        print(f"Error creating Google OAuth client: {e}")
    
    try:
        github_client = oauth.create_client('github')
        print(f"GitHub OAuth client available: {github_client is not None}")
    except Exception as e:
        print(f"Error creating GitHub OAuth client: {e}")

# Swagger configuration
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs/"
}

# Swagger template with custom title and info
swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Canner API Documentation",
        "description": "API for managing canned responses - AI-powered LinkedIn & Twitter Assistant",
        "version": "1.0.0",
        "contact": {
            "name": "Canner Team",
            "email": "baivab@techtutorialswithpiyush.com"
        },
        "license": {
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT"
        }
    },
    "host": "localhost:5000",
    "basePath": "/",
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///responses.db')
DATABASE = 'responses.db'  # Fallback for SQLite


def get_db_connection(max_retries: int = 5, base_delay: float = 1.0):
    """Create a database connection with automatic retry logic.
    
    Args:
        max_retries: Maximum number of connection attempts
        base_delay: Base delay between retries (exponential backoff)
    """
    db_url = os.getenv('DATABASE_URL', 'sqlite:///responses.db')
    
    if db_url.startswith('postgresql://') or db_url.startswith('postgres://'):
        if not POSTGRES_AVAILABLE:
            raise ImportError("PostgreSQL URL provided but psycopg2 not installed")
        
        # PostgreSQL connection with retry logic
        for attempt in range(max_retries + 1):
            try:
                conn = psycopg2.connect(db_url)
                conn.autocommit = True
                
                # Test the connection
                cursor = conn.cursor()
                cursor.execute('SELECT 1')
                cursor.close()
                
                if attempt > 0:
                    logging.info(f"✅ PostgreSQL connection established after {attempt} retries")
                return conn
                
            except (psycopg2.OperationalError, psycopg2.DatabaseError) as e:
                if attempt == max_retries:
                    logging.error(f"❌ Failed to connect to PostgreSQL after {max_retries} attempts: {e}")
                    raise
                
                delay = base_delay * (2 ** attempt)  # Exponential backoff
                logging.warning(f"⚠️  PostgreSQL connection attempt {attempt + 1} failed, retrying in {delay}s: {e}")
                time.sleep(delay)
    else:
        # SQLite connection (default) - no retry needed for local files
        # Extract path from URL if it's a sqlite:// URL, otherwise use as-is
        if db_url.startswith('sqlite:///'):
            db_path = db_url[10:]  # Remove 'sqlite:///' prefix
        elif db_url.startswith('sqlite://'):
            db_path = db_url[9:]   # Remove 'sqlite://' prefix
        else:
            db_path = db_url
        
        # Ensure directory exists for SQLite
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else '.', exist_ok=True)
        
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn

def is_postgres():
    """Check if we're using PostgreSQL."""
    db_url = os.getenv('DATABASE_URL', 'sqlite:///responses.db')
    return db_url.startswith('postgresql://') or db_url.startswith('postgres://')

def execute_query(conn, query: str, params: tuple = ()) -> Union[list, None]:
    """Execute a query with proper cursor handling for both SQLite and PostgreSQL."""
    if is_postgres():
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query, params)
        # Handle both SELECT and RETURNING clauses
        if (query.strip().upper().startswith('SELECT') or 
            'RETURNING' in query.upper()):
            return cursor.fetchall()
        return None
    else:
        cursor = conn.execute(query, params)
        if query.strip().upper().startswith('SELECT'):
            return cursor.fetchall()
        conn.commit()
        return None


def init_db(max_retries: int = 10):
    """Initialize the database with required tables.
    
    Args:
        max_retries: Maximum number of initialization attempts
    """
    for attempt in range(max_retries + 1):
        try:
            # Use DatabaseService to initialize the database
            DatabaseService.initialize()
            
            db_type = 'PostgreSQL' if is_postgres() else 'SQLite'
            if attempt > 0:
                logging.info(f"✅ Database initialized ({db_type}) after {attempt} retries")
            else:
                logging.info(f"✅ Database initialized ({db_type})")
            return
            
        except Exception as e:
            if attempt == max_retries:
                logging.error(f"❌ Failed to initialize database after {max_retries} attempts: {e}")
                raise
            
            delay = 2 ** attempt  # Exponential backoff
            logging.warning(f"⚠️  Database initialization attempt {attempt + 1} failed, retrying in {delay}s: {e}")
            time.sleep(delay)


def dict_from_row(row) -> Dict[str, Any]:
    """Convert a database row to a dictionary."""
    if is_postgres():
        # PostgreSQL RealDictRow - tags is already JSONB (list/dict)
        tags = row['tags'] if row['tags'] is not None else []
        if isinstance(tags, str):
            tags = json.loads(tags)
    else:
        # SQLite Row - tags is JSON string
        tags = json.loads(row['tags']) if row['tags'] else []
    
    return {
        'id': str(row['id']),  # Ensure ID is always string for consistency
        'title': row['title'],
        'content': row['content'],
        'tags': tags,
        'created_at': str(row['created_at']) if row['created_at'] else None,
        'updated_at': str(row['updated_at']) if row['updated_at'] else None
    }

# api to get all responses with optional search
@app.route('/api/responses', methods=['GET'])
def get_responses():
    """
    Get all responses
    Retrieve all stored responses, optionally filtered by a search query. The search parameter performs case-insensitive matching across title, content, and tags fields.
    ---
    tags:
      - responses
    parameters:
      - name: search
        in: query
        type: string
        required: false
        description: Optional search term to filter responses. Searches across title, content, and tags fields.
        example: "connection"
    responses:
      200:
        description: Successful response with array of responses
        schema:
          type: array
          items:
            $ref: '#/definitions/Response'
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/Error'
    definitions:
      Response:
        type: object
        required:
          - id
          - title
          - content
          - tags
          - created_at
          - updated_at
        properties:
          id:
            type: string
            description: Unique identifier for the response
            example: "123e4567-e89b-12d3-a456-426614174000"
          title:
            type: string
            description: Short title for the response template
            example: "New Learning Appreciation"
          content:
            type: string
            description: The full text content of the response
            example: "Just finished reading your post on {{topic}} \u2014 insightful and practical! Thanks for sharing your expertise."
          tags:
            type: array
            items:
              type: string
            description: Array of tags for categorizing the response
            example: ["learning", "content", "appreciation"]
          created_at:
            type: string
            format: date-time
            description: Timestamp when the response was created
            example: "2025-01-15T10:30:00Z"
          updated_at:
            type: string
            format: date-time
            description: Timestamp when the response was last updated
            example: "2025-01-15T10:30:00Z"
      Error:
        type: object
        required:
          - error
        properties:
          error:
            type: string
            description: Error message
            example: "Internal server error"
    """
    search = request.args.get('search', '')
    
    conn = get_db_connection()
    
    # Get active profile for current user if authenticated
    profile_id = None
    if 'user_id' in session:
        user_id = session['user_id']
        profile = DatabaseService.get_active_profile_by_user_id(user_id)
        if profile:
            profile_id = profile.id
        logging.info(f"User {user_id} active profile: {profile_id} ({profile.profile_name if profile else 'None'})")
    
    if search and profile_id:
        if is_postgres():
            # PostgreSQL with ILIKE for case-insensitive search and JSONB contains
            query = '''
                SELECT * FROM responses 
                WHERE profile_id = %s AND (title ILIKE %s OR content ILIKE %s OR tags::text ILIKE %s)
                ORDER BY created_at DESC
            '''
            search_term = f'%{search}%'
            rows = execute_query(conn, query, (profile_id, search_term, search_term, search_term))
        else:
            # SQLite with LIKE
            query = '''
                SELECT * FROM responses 
                WHERE profile_id = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
                ORDER BY created_at DESC
            '''
            search_term = f'%{search}%'
            rows = execute_query(conn, query, (profile_id, search_term, search_term, search_term))
    elif search:
        if is_postgres():
            # PostgreSQL with ILIKE for case-insensitive search and JSONB contains
            query = '''
                SELECT * FROM responses 
                WHERE title ILIKE %s OR content ILIKE %s OR tags::text ILIKE %s
                ORDER BY created_at DESC
            '''
            search_term = f'%{search}%'
            rows = execute_query(conn, query, (search_term, search_term, search_term))
        else:
            # SQLite with LIKE
            query = '''
                SELECT * FROM responses 
                WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
                ORDER BY created_at DESC
            '''
            search_term = f'%{search}%'
            rows = execute_query(conn, query, (search_term, search_term, search_term))
    elif profile_id:
        if is_postgres():
            rows = execute_query(conn, 'SELECT * FROM responses WHERE profile_id = %s ORDER BY created_at DESC', 
                               (profile_id,))
        else:
            rows = execute_query(conn, 'SELECT * FROM responses WHERE profile_id = ? ORDER BY created_at DESC', 
                               (profile_id,))
    else:
        # If no profile is active, show responses without profile_id (legacy responses)
        if is_postgres():
            rows = execute_query(conn, 'SELECT * FROM responses WHERE profile_id IS NULL ORDER BY created_at DESC')
        else:
            rows = execute_query(conn, 'SELECT * FROM responses WHERE profile_id IS NULL ORDER BY created_at DESC')
    
    conn.close()
    
    responses = [dict_from_row(row) for row in rows] if rows else []
    return jsonify(responses)

# api to get a single response with id
@app.route('/api/responses/<response_id>', methods=['GET'])
def get_response(response_id: str):
    """
    Get a single response by ID
    Retrieve a single stored response by its unique identifier.
    ---
    tags:
      - responses
    parameters:
      - name: response_id
        in: path
        type: string
        required: true
        description: Unique identifier of the response to retrieve
        example: "123e4567-e89b-12d3-a456-426614174000"
    responses:
      200:
        description: Successful response with the requested response
        schema:
          $ref: '#/definitions/Response'
        examples:
          application/json:
            id: "123e4567-e89b-12d3-a456-426614174000"
            title: "Connection Request - Developer"
            content: "Hi! I'd like to connect with you. I'm a software developer with 5 years of experience in web development."
            tags: ["connection", "developer", "networking"]
            created_at: "2025-01-15T10:30:00Z"
            updated_at: "2025-01-15T10:30:00Z"
      404:
        description: Response not found
        schema:
          $ref: '#/definitions/Error'
        examples:
          application/json:
            error: "Response not found"
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/Error'
        examples:
          application/json:
            error: "Database connection failed"
    """
    
    conn = get_db_connection()
    
    if is_postgres():
        # PostgreSQL uses UUID type
        query = 'SELECT * FROM responses WHERE id = %s'
        rows = execute_query(conn, query, (response_id,))
    else:
        # SQLite uses TEXT
        query = 'SELECT * FROM responses WHERE id = ?'
        rows = execute_query(conn, query, (response_id,))
    
    conn.close()
    
    if not rows:
        return jsonify({'error': 'Response not found'}), 404
    
    return jsonify(dict_from_row(rows[0]))

# api to Create a new response
@app.route('/api/responses', methods=['POST'])
def create_response():
    """
    Create a new response
    
    Create a new response with title, content, and optional tags.
    ---
    tags:
      - responses
    parameters:
      - name: title
        in: body
        required: true
        schema:
          type: object
          required:
            - title
            - content
          properties:
            title:
              type: string
              description: Short title for the response template
              example: "New Learning Appreciation"
            content:
              type: string
              description: The full text content of the response
              example: "Just finished reading your post on {{topic}} \u2014 insightful and practical! Thanks for sharing your expertise."
            tags:
              type: array
              items:
                type: string
              description: Array of tags for categorizing the response
              example: ["learning", "content", "appreciation"]
    responses:
      201:
        description: Response created successfully
        schema:
          $ref: '#/definitions/Response'
      400:
        description: Bad request (e.g., missing required fields)
        schema:
          $ref: '#/definitions/Error'
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/Error'
    definitions:
      Response:
        type: object
        required:
          - id
          - title
          - content
          - tags
          - created_at
          - updated_at
        properties:
          id:
            type: string
            description: Unique identifier for the response
            example: "4c550e80-73a3-438e-8f4b-af20cdac0ff1"
          title:
            type: string
            description: Short title for the response template
            example: "New Learning Appreciation"
          content:
            type: string
            description: The full text content of the response
            example: "Just finished reading your post on {{topic}} \u2014 insightful and practical! Thanks for sharing your expertise."
          tags:
            type: array
            items:
              type: string
            description: Array of tags for categorizing the response
            example: ["learning", "content", "appreciation"]
          created_at:
            type: string
            format: date-time
            description: Timestamp when the response was created
            example: "2025-01-15T10:30:00Z"
          updated_at:
            type: string
            format: date-time
            description: Timestamp when the response was last updated
            example: "2025-01-15T10:30:00Z"
      Error:
        type: object
        required:
          - error
        properties:
          error:
            type: string
            description: Error message
            example: "Internal server error"
    """
    data = request.get_json()
    
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'error': 'Title and content are required'}), 400
    
    title = data['title']
    content = data['content']
    tags = data.get('tags', [])
    
    # Get active profile for current user if authenticated
    profile_id = None
    if 'user_id' in session:
        user_id = session['user_id']
        profile = DatabaseService.get_active_profile_by_user_id(user_id)
        if profile:
            profile_id = profile.id
    
    conn = get_db_connection()
    
    if is_postgres():
        # PostgreSQL with JSONB and auto-generated UUID
        query = '''
            INSERT INTO responses (title, content, tags, profile_id) 
            VALUES (%s, %s, %s, %s) 
            RETURNING *
        '''
        rows = execute_query(conn, query, (title, content, json.dumps(tags), profile_id))
        response_data = dict_from_row(rows[0]) if rows else None
    else:
        # SQLite with manual UUID
        response_id = str(uuid.uuid4())
        query = 'INSERT INTO responses (id, title, content, tags, profile_id) VALUES (?, ?, ?, ?, ?)'
        execute_query(conn, query, (response_id, title, content, json.dumps(tags), profile_id))
        
        # Fetch the created record
        rows = execute_query(conn, 'SELECT * FROM responses WHERE id = ?', (response_id,))
        response_data = dict_from_row(rows[0]) if rows else None
    
    conn.close()
    
    if not response_data:
        return jsonify({'error': 'Failed to create response'}), 500
    
    return jsonify(response_data), 201

# api to update a response
@app.route('/api/responses/<response_id>', methods=['PUT'])
def update_response(response_id: str):
    """
    Update an existing response by ID
    Update an existing response's title, content, and/or tags by its unique identifier.
    ---
    tags:
      - responses
    parameters:
      - name: response_id
        in: path
        type: string
        required: true
        description: Unique identifier of the response to update
        example: "123e4567-e89b-12d3-a456-426614174000"
      - name: body
        in: body
        required: false
        schema:
          type: object
          properties:
            title:
              type: string
              description: Short title for the response template
              example: "Updated Learning Appreciation"
            content:
              type: string
              description: The full text content of the response
              example: "Just finished reading your updated post on {{topic}} — very insightful and practical! Thanks for sharing your expertise."
            tags:
              type: array
              items:
                type: string
              description: Array of tags for categorizing the response
              example: ["learning", "content", "appreciation", "updated"]
    responses:
      200:
        description: Response updated successfully
        schema:
          $ref: '#/definitions/Response'
        examples:
          application/json:
            id: "123e4567-e89b-12d3-a456-426614174000"
            title: "Updated Learning Appreciation"
            content: "Just finished reading your updated post on machine learning — very insightful and practical! Thanks for sharing your expertise."
            tags: ["learning", "content", "appreciation", "updated"]
            created_at: "2025-01-15T10:30:00Z"
            updated_at: "2025-01-15T12:45:00Z"
      400:
        description: Bad request (e.g., no data provided)
        schema:
          $ref: '#/definitions/Error'
        examples:
          application/json:
            error: "No data provided"
      404:
        description: Response not found
        schema:
          $ref: '#/definitions/Error'
        examples:
          application/json:
            error: "Response not found"
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/Error'
        examples:
          application/json:
            error: "Database connection failed"
    """
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db_connection()
    
    # Check if response exists
    if is_postgres():
        check_query = 'SELECT * FROM responses WHERE id = %s'
        check_params = (response_id,)
    else:
        check_query = 'SELECT * FROM responses WHERE id = ?'
        check_params = (response_id,)
    
    existing = execute_query(conn, check_query, check_params)
    if not existing:
        conn.close()
        return jsonify({'error': 'Response not found'}), 404
    
    # Build update query dynamically based on provided fields
    updates = []
    params = []
    
    if 'title' in data:
        updates.append('title = %s' if is_postgres() else 'title = ?')
        params.append(data['title'])
    
    if 'content' in data:
        updates.append('content = %s' if is_postgres() else 'content = ?')
        params.append(data['content'])
    
    if 'tags' in data:
        if is_postgres():
            updates.append('tags = %s::jsonb')
            params.append(json.dumps(data['tags']))
        else:
            updates.append('tags = ?')
            params.append(json.dumps(data['tags']))
    
    if updates:
        if is_postgres():
            updates.append('updated_at = CURRENT_TIMESTAMP')
            query = f'UPDATE responses SET {", ".join(updates)} WHERE id = %s RETURNING *'
            params.append(response_id)
            rows = execute_query(conn, query, params)
            response_data = dict_from_row(rows[0]) if rows else None
        else:
            updates.append('updated_at = CURRENT_TIMESTAMP')
            query = f'UPDATE responses SET {", ".join(updates)} WHERE id = ?'
            params.append(response_id)
            execute_query(conn, query, params)
            
            # Fetch updated record
            rows = execute_query(conn, 'SELECT * FROM responses WHERE id = ?', (response_id,))
            response_data = dict_from_row(rows[0]) if rows else None
    else:
        response_data = dict_from_row(existing[0])
    
    conn.close()
    
    return jsonify(response_data)

# api to delete a response
@app.route('/api/responses/<response_id>', methods=['DELETE'])
def delete_response(response_id: str):
    """
    Delete a response by ID
    Delete a stored response by its unique identifier.
    ---
    tags:
      - responses
    parameters:
      - name: response_id
        in: path
        type: string
        required: true
        description: Unique identifier of the response to delete
        example: "123e4567-e89b-12d3-a456-426614174000"
    responses:
      204:
        description: Response deleted successfully (no content returned)
      404:
        description: Response not found
        schema:
          $ref: '#/definitions/Error'
        examples:
          application/json:
            error: "Response not found"
      500:
        description: Internal server error
        schema:
          $ref: '#/definitions/Error'
        examples:
          application/json:
            error: "Database connection failed"
    """
    conn = get_db_connection()
    
    # Check if response exists
    if is_postgres():
        check_query = 'SELECT * FROM responses WHERE id = %s'
        delete_query = 'DELETE FROM responses WHERE id = %s'
        params = (response_id,)
    else:
        check_query = 'SELECT * FROM responses WHERE id = ?'
        delete_query = 'DELETE FROM responses WHERE id = ?'
        params = (response_id,)
    
    existing = execute_query(conn, check_query, params)
    if not existing:
        conn.close()
        return jsonify({'error': 'Response not found'}), 404
    
    execute_query(conn, delete_query, params)
    conn.close()
    
    return '', 204

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    Health check endpoint with database connectivity test to verify API and database status.
    ---
    tags:
      - health
    responses:
      200:
        description: API is healthy and database is connected
        schema:
          type: object
          properties:
            status:
              type: string
              description: Health status
              example: "healthy"
            timestamp:
              type: string
              format: date-time
              description: Current timestamp
              example: "2025-10-14T10:30:00.123456"
            database:
              type: string
              description: Database type being used
              example: "SQLite"
            database_connected:
              type: boolean
              description: Whether database connection is successful
              example: true
        examples:
          application/json:
            status: "healthy"
            timestamp: "2025-10-14T10:30:00.123456"
            database: "SQLite"
            database_connected: true
      503:
        description: Service unavailable (database connection failed)
        schema:
          type: object
          properties:
            status:
              type: string
              description: Health status
              example: "unhealthy"
            timestamp:
              type: string
              format: date-time
              description: Current timestamp
              example: "2025-10-14T10:30:00.123456"
            database:
              type: string
              description: Database type being used
              example: "SQLite"
            database_connected:
              type: boolean
              description: Whether database connection is successful
              example: false
            error:
              type: string
              description: Error message
              example: "Database connection failed"
        examples:
          application/json:
            status: "unhealthy"
            timestamp: "2025-10-14T10:30:00.123456"
            database: "SQLite"
            database_connected: false
            error: "Database connection failed"
    """
    try:
        # Test database connection
        conn = get_db_connection(max_retries=1)  # Quick test, don't wait long
        cursor = conn.cursor() if is_postgres() else conn
        
        if is_postgres():
            cursor.execute('SELECT 1')
        else:
            cursor.execute('SELECT 1')
            
        conn.close()
        
        return jsonify({
            'status': 'healthy', 
            'timestamp': datetime.now().isoformat(),
            'database': 'PostgreSQL' if is_postgres() else 'SQLite',
            'database_connected': True
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'database': 'PostgreSQL' if is_postgres() else 'SQLite',
            'database_connected': False,
            'error': str(e)
        }), 503

# OAuth routes
@app.route('/api/auth/login/<provider>')
def oauth_login(provider):
    """Initiate OAuth login with the specified provider."""
    if provider not in ['google', 'github']:
        return jsonify({'error': 'Unsupported provider'}), 400
    
    # Check if OAuth is properly initialized
    if oauth is None:
        return jsonify({'error': 'OAuth not available'}), 500
    
    try:
        redirect_uri = url_for('oauth_callback', provider=provider, _external=True)
        return oauth.create_client(provider).authorize_redirect(redirect_uri)
    except Exception as e:
        print(f"OAuth login error: {e}")
        return jsonify({'error': 'OAuth login failed'}), 500

@app.route('/api/auth/callback/<provider>')
def oauth_callback(provider):
    """Handle OAuth callback from the provider."""
    if provider not in ['google', 'github']:
        return jsonify({'error': 'Unsupported provider'}), 400
    
    # Check if OAuth is properly initialized
    if oauth is None:
        return jsonify({'error': 'OAuth not available'}), 500
    
    try:
        print(f"Processing OAuth callback for {provider}")
        token = oauth.create_client(provider).authorize_access_token()
        print(f"Received token: {token}")
        
        # Extract token value
        token_value = token.get('access_token') if isinstance(token, dict) else token
        print(f"Token value: {token_value}")
        
        user = authenticate_user(provider, token_value)
        print(f"Authenticated user: {user}")
        
        if not user:
            print("Authentication failed - no user returned")
            return jsonify({'error': 'Authentication failed'}), 401
        
        # Store user info in session
        session['user_id'] = user.id
        session['user_provider'] = user.provider
        session['user_email'] = user.email
        session['user_name'] = user.name
        session.permanent = True  # Make session permanent
        print(f"User session stored: {session}")
        
        # Redirect to frontend with success message
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return '''
        <html>
        <head>
            <title>Authentication Success</title>
        </head>
        <body>
            <script>
                // Send message to opener window
                if (window.opener) {
                    window.opener.postMessage({"type": "oauth-success"}, "*");
                }
                // Close this window
                window.close();
            </script>
            <div style="text-align: center; padding: 20px;">
                <h2>Authentication Successful!</h2>
                <p>You can close this window and return to the application.</p>
                <button onclick="window.close()">Close Window</button>
            </div>
        </body>
        </html>
        '''
        
    except Exception as e:
        print(f"OAuth callback error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Authentication failed'}), 500

@app.route('/api/auth/logout')
def logout():
    """Logout the current user."""
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

# Profile management endpoints
@app.route('/api/profiles', methods=['GET'])
@require_auth
def get_profiles():
    """Get all profiles for the current user."""
    user_id = get_current_user_id()
    profiles = DatabaseService.get_profiles_by_user_id(user_id)
    return jsonify([profile.to_dict() for profile in profiles])

@app.route('/api/profiles/active', methods=['GET'])
@require_auth
def get_active_profile():
    """Get the active profile for the current user."""
    user_id = get_current_user_id()
    profile = DatabaseService.get_active_profile_by_user_id(user_id)
    if not profile:
        return jsonify({'error': 'No active profile found'}), 404
    return jsonify(profile.to_dict())

@app.route('/api/profiles', methods=['POST'])
@require_auth
def create_profile():
    """Create a new profile for the current user."""
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data or 'profile_name' not in data or 'topic' not in data:
        return jsonify({'error': 'Profile name and topic are required'}), 400
    
    # Check if this is the first profile for the user
    existing_profiles = DatabaseService.get_profiles_by_user_id(user_id)
    is_active = len(existing_profiles) == 0  # Make first profile active by default
    
    try:
        profile = DatabaseService.create_profile(
            user_id=user_id,
            profile_name=data['profile_name'],
            topic=data['topic'],
            is_active=is_active
        )
        return jsonify(profile.to_dict()), 201
    except Exception as e:
        print(f"Error creating profile: {e}")
        return jsonify({'error': 'Failed to create profile'}), 500

@app.route('/api/profiles/<profile_id>/activate', methods=['POST'])
@require_auth
def activate_profile(profile_id):
    """Activate a profile for the current user."""
    user_id = get_current_user_id()
    profile = DatabaseService.update_profile_active_status(profile_id, user_id, True)
    
    if not profile:
        return jsonify({'error': 'Profile not found or access denied'}), 404
    
    return jsonify(profile.to_dict())

@app.route('/api/profiles/<profile_id>', methods=['DELETE'])
@require_auth
def delete_profile(profile_id):
    """Delete a profile for the current user."""
    user_id = get_current_user_id()
    
    # Check if this is the active profile
    active_profile = DatabaseService.get_active_profile_by_user_id(user_id)
    is_active_profile = active_profile and active_profile.id == profile_id
    
    success = DatabaseService.delete_profile(profile_id, user_id)
    
    if not success:
        return jsonify({'error': 'Profile not found or access denied'}), 404
    
    # If we deleted the active profile, activate the first available profile
    if is_active_profile:
        profiles = DatabaseService.get_profiles_by_user_id(user_id)
        if profiles:
            # Activate the first profile
            DatabaseService.update_profile_active_status(profiles[0].id, user_id, True)
    
    return '', 204

@app.route('/api/auth/user')
def get_current_user():
    """Get the current authenticated user."""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Get user by actual user ID instead of provider ID
    user = DatabaseService.get_user_by_id(session['user_id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'provider': user.provider,
        'avatar_url': user.avatar_url
    })

if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Show which database we're using
    db_url = os.getenv('DATABASE_URL', 'sqlite:///responses.db')
    logging.info(f'🔧 Using DATABASE_URL: {db_url}')
    
    try:
        # Initialize database with retry logic
        logging.info('🔄 Initializing database...')
        init_db()
        
        logging.info('🚀 Starting Flask server on http://0.0.0.0:5000')
        logging.info('📚 Swagger docs available at http://localhost:5000/docs/')
        app.run(debug=True, host='0.0.0.0', port=5000)
        
    except Exception as e:
        logging.error(f'❌ Failed to start application: {e}')
        exit(1)
