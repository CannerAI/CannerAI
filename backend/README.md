# Response Saver Backend

Flask REST API for managing saved responses.

## Setup

```bash
pip install -r requirements.txt
python app.py
```

## API Documentation

### Get All Responses

```
GET /api/responses
Query params:
  - search: Optional search term
```

### Get Single Response

```
GET /api/responses/:id
```

### Create Response

```
POST /api/responses
Body: {
  "title": "string",
  "content": "string",
  "tags": ["string"]
}
```

### Update Response

```
PUT /api/responses/:id
Body: {
  "title": "string (optional)",
  "content": "string (optional)",
  "tags": ["string"] (optional)
}
```

### Delete Response

```
DELETE /api/responses/:id
```

### Health Check

```
GET /api/health
```

## Database Schema

### responses table

- `id` (TEXT, PRIMARY KEY)
- `title` (TEXT, NOT NULL)
- `content` (TEXT, NOT NULL)
- `tags` (TEXT, JSON array)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Development

The database file `responses.db` is created automatically on first run.

## Environment

- Python 3.8+
- Flask 3.0.0
- SQLite3
