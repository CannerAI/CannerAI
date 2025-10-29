# Canner Backend

Flask backend for the Canner browser extension with authentication, response storage, and API endpoints.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/canner.git
cd canner/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (see below)
# Create .env file or export variables

# Run the server
python app.py
```

The server will start on `http://localhost:5000` with Swagger docs at `http://localhost:5000/docs/`

## ⚙️ Environment Variables

Create a `.env` file in the backend directory:

```env
# OAuth Configuration (required for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Flask Configuration
SECRET_KEY=your_secret_key_here
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://your_extension_id

# Database Configuration (optional)
DATABASE_URL=sqlite:///responses.db
```

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/callback/google`

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:5000/api/auth/callback/github`

## Development

- Database is created automatically on first run
- Supports both SQLite (default) and PostgreSQL
- Hot reload enabled in debug mode
- CORS configured for browser extension support

## Requirements

- Python 3.8+
- Flask 3.0.0
- SQLite3 or PostgreSQL (optional)
- OAuth provider credentials
