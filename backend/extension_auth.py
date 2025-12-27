# Flask Backend Authentication Implementation for Chrome Extension
# Add these endpoints to your app.py

import secrets
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

# Configuration - Add to your app.py or config file
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# In-memory storage for auth codes (use Redis in production)
# Format: { "code": { "user_id": "123", "expires_at": datetime, "used": False } }
AUTH_CODES = {}


def generate_jwt(user_id: str) -> str:
    """Generate a JWT token for the user."""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_jwt(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def require_auth(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return jsonify({"error": "No authorization header"}), 401
        
        try:
            # Extract Bearer token
            token = auth_header.replace("Bearer ", "")
            payload = verify_jwt(token)
            
            # Add user info to request context
            request.user_id = payload["user_id"]
            
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({"error": str(e)}), 401
    
    return decorated_function


# ==================== Extension Auth Endpoints ====================

@app.route("/api/auth/generate-code", methods=["POST"])
def generate_extension_code():
    """
    Generate a short-lived authorization code for extension authentication.
    Called by the web app after user logs in.
    
    Expects: Authorization header with web app session token
    Returns: { "code": "abc123..." }
    """
    # TODO: Verify the request is from your web app
    # For now, expecting user_id in request body
    data = request.get_json()
    user_id = data.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    # Generate a secure random code
    code = secrets.token_urlsafe(32)
    
    # Store code with expiration (10 minutes)
    AUTH_CODES[code] = {
        "user_id": user_id,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "used": False
    }
    
    # Clean up expired codes
    _cleanup_expired_codes()
    
    return jsonify({"code": code}), 200


@app.route("/auth/extension/exchange-code", methods=["POST"])
def exchange_extension_code():
    """
    Exchange authorization code for JWT token.
    Called by the Chrome extension after receiving the code.
    
    Request: { "auth_code": "abc123..." }
    Response: { "jwt_token": "eyJ...", "user_id": "123" }
    """
    data = request.get_json()
    auth_code = data.get("auth_code")
    
    if not auth_code:
        return jsonify({"error": "auth_code is required"}), 400
    
    # Validate code
    code_data = AUTH_CODES.get(auth_code)
    
    if not code_data:
        return jsonify({"error": "Invalid or expired authorization code"}), 401
    
    if code_data["used"]:
        return jsonify({"error": "Authorization code already used"}), 401
    
    if datetime.utcnow() > code_data["expires_at"]:
        del AUTH_CODES[auth_code]
        return jsonify({"error": "Authorization code has expired"}), 401
    
    # Mark code as used
    code_data["used"] = True
    
    # Generate JWT token
    user_id = code_data["user_id"]
    jwt_token = generate_jwt(user_id)
    
    # Clean up the used code
    del AUTH_CODES[auth_code]
    
    return jsonify({
        "jwt_token": jwt_token,
        "user_id": user_id,
        "expires_in": JWT_EXPIRATION_HOURS * 3600  # seconds
    }), 200


@app.route("/api/templates", methods=["GET"])
@require_auth
def get_templates():
    """
    Get user-specific canned messages/templates.
    PROTECTED - Requires valid JWT token.
    
    Header: Authorization: Bearer {JWT_TOKEN}
    Returns: List of templates/canned messages
    """
    user_id = request.user_id  # Set by @require_auth decorator
    
    # Get user's canned responses from database
    db = get_db_connection()
    collection = db['canned_responses']
    
    # Filter by user_id if you have multi-user support
    # For now, returning all responses (you may want to add user_id field)
    cursor = collection.find().sort('created_at', DESCENDING)
    templates = [dict_from_doc(doc) for doc in cursor]
    
    return jsonify(templates), 200


# ==================== Helper Functions ====================

def _cleanup_expired_codes():
    """Remove expired authorization codes."""
    now = datetime.utcnow()
    expired_codes = [
        code for code, data in AUTH_CODES.items()
        if data["expires_at"] < now
    ]
    for code in expired_codes:
        del AUTH_CODES[code]


# ==================== Test Endpoint (Development Only) ====================

@app.route("/test/create-test-code", methods=["POST"])
def create_test_code():
    """
    Development helper to create a test auth code without web app.
    Remove this in production!
    """
    code = secrets.token_urlsafe(32)
    test_user_id = "test_user_123"
    
    AUTH_CODES[code] = {
        "user_id": test_user_id,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "used": False
    }
    
    return jsonify({
        "code": code,
        "user_id": test_user_id,
        "redirect_url": f"chrome-extension://YOUR_EXTENSION_ID/auth-callback.html?code={code}",
        "message": "Use this code to test the extension authentication"
    }), 200


# ==================== Installation Instructions ====================

"""
1. Install required package:
   pip install pyjwt

2. Add to your .env file:
   JWT_SECRET_KEY=your-very-secret-key-here-change-in-production

3. Update extension API URL:
   In browser-extension/src/utils/api.ts, change:
   const API_URL = "http://localhost:5000";

4. Test the flow:
   a) Start Flask: python app.py
   b) Create test code: curl -X POST http://localhost:5000/test/create-test-code
   c) Copy the redirect_url and open in browser
   d) Extension should complete auth and fetch templates
"""
