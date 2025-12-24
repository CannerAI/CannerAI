# Canner Backend

Flask REST API for managing canned responses with MongoDB database.

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# From the project root directory
docker compose up --build

# The backend will be available at http://localhost:5000
```

### Manual Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables (copy and edit .env.example)
cp .env.example .env.development
# Edit .env.development with your MongoDB connection string

# Run the application
python app.py
```

## 📋 Prerequisites

- Python 3.8+
- MongoDB Atlas account (free tier available) OR Local MongoDB installation
- Docker & Docker Compose (for containerized setup)

## ⚙️ Environment Variables

```bash
# MongoDB Atlas (Cloud)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=cannerai_db

# Or Local MongoDB
DATABASE_URL=mongodb://localhost:27017/
MONGODB_DB_NAME=cannerai_dev

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
FLASK_APP=app.py
```

See `.env.example` for a complete configuration template.

## 🗄️ Database

This backend uses **MongoDB** with the following features:

- **Document-based storage** for flexible schema
- **Array fields** for tags
- **Full-text search** indexes on title and content
- **Automatic timestamps** (created_at, updated_at)
- **ObjectId** for unique document identifiers

### Database Schema

The database is initialized automatically via `database/init.js`:

```javascript
// Collection: canned_responses
{
  _id: ObjectId,              // Auto-generated unique identifier
  title: String,              // Response title
  content: String,            // Response content
  tags: Array<String>,        // Tags for categorization
  created_at: Date,           // Creation timestamp
  updated_at: Date            // Last update timestamp
}
```

### Indexes

The following indexes are automatically created for optimal performance:

- **Text Index**: `title` and `content` for full-text search
- **Tags Index**: For efficient tag-based filtering
- **Created At Index**: For chronological sorting
- **Updated At Index**: For recent updates queries

```javascript
// Text search index
db.canned_responses.createIndex(
  { title: 'text', content: 'text' },
  { weights: { title: 2, content: 1 } }
)

// Other indexes
db.canned_responses.createIndex({ tags: 1 })
db.canned_responses.createIndex({ created_at: -1 })
db.canned_responses.createIndex({ updated_at: -1 })
```

## 📡 API Documentation

### Get All Responses

```http
GET /api/responses
Query params:
  - search: Optional search term (searches title, content, and tags)
```

### Get Single Response

```http
GET /api/responses/:id
```

### Create Response

```http
POST /api/responses
Content-Type: application/json

{
  "title": "string",
  "content": "string",
  "tags": ["string"]
}
```

Response: 201 Created with the created response object (includes auto-generated ObjectId)

Example response:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Welcome Message",
  "content": "Thank you for reaching out!",
  "tags": ["greeting", "general"],
  "created_at": "2025-12-25T10:00:00.000Z",
  "updated_at": "2025-12-25T10:00:00.000Z"
}
```

### Update Response

```http
PUT /api/responses/:id
Content-Type: application/json

{
  "title": "string (optional)",
  "content": "string (optional)",
  "tags": ["string"] (optional)
}
```

Response: 200 OK with updated response object

### Delete Response

```http
DELETE /api/responses/:id
```

Response: 204 No Content

### Health Check

```http
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T12:00:00",
  "database": "MongoDB",
  "database_connected": true
}
```

## 🛠️ Development

### Running with Docker

```bash
# Start backend
docker compose up --build

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

### Database Management

#### Option 1: MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your connection string:
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/`
   - Local: `mongodb://localhost:27017/`
3. Navigate to `cannerai_db` > `canned_responses`

#### Option 2: MongoDB Shell (CLI)

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/cannerai_db"
# Or for Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/cannerai_db"

# Useful commands
show dbs                                    # List databases
use cannerai_db                             # Switch to database
show collections                            # List collections
db.canned_responses.find().pretty()         # View all documents
db.canned_responses.countDocuments()        # Count documents
db.canned_responses.getIndexes()            # View indexes
```

### Connection Retry Logic

The backend automatically retries MongoDB connections with exponential backoff:
- Waits for database to be ready on startup
- Reconnects if connection is lost
- Maximum 5 retries with increasing delays

## 📦 Dependencies

- **Flask 3.0.0** - Web framework
- **flask-cors 4.0.0** - CORS support
- **pymongo 4.6.1** - MongoDB driver for Python
- **python-dotenv 1.0.0** - Environment variable management
- **flask-swagger-ui 4.11.1** - API documentation UI

## 🔍 Testing

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test create response
curl -X POST http://localhost:5000/api/responses \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Test content", "tags": ["test"]}'

# Test get all responses
curl http://localhost:5000/api/responses

# Test search
curl "http://localhost:5000/api/responses?search=test"
```

## 🚨 Troubleshooting

**Database connection errors:**
- Verify MongoDB connection string in `.env.development`
- For Atlas: Check if your IP is whitelisted in Atlas Network Access
- For Local: Ensure MongoDB service is running: `sudo systemctl status mongod`
- Check database logs for authentication errors

**Common Connection Issues:**

```bash
# Test MongoDB connection
mongosh "your-connection-string" --eval "db.adminCommand('ping')"

# Check if MongoDB is running locally
sudo systemctl status mongod

# Start MongoDB locally
sudo systemctl start mongod
```

**Port already in use:**
```bash
# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use 5001 instead of 5000
```

**Atlas Connection Issues:**
- Ensure your IP address is whitelisted in Atlas Network Access
- Verify username and password are correct
- Check that the database user has read/write permissions

## 📄 License

See LICENSE file in project root.
