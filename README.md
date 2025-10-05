# Canner - AI-Powered LinkedIn & Twitter Assistant

> 🚀 A sophisticated browser extension and backend system that enhances your social media productivity with AI-powered response suggestions and seamless content management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg)](https://python.org)

## ✨ Features
- Select from a variety of pre-defined response templates
- Format linked post with Ease

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **Python 3.12+** (for backend development)

### 🐳 **Docker Setup (Recommended)**

```bash
# Clone the repository
git clone https://github.com/piyushsachdeva/canner.git
cd canner

# Start all services
docker-compose up --build

# The backend API will be available at: http://localhost:5000
# Load the browser extension from: ./browser-extension/dist
```

## 📦 **Installation Guide**

### 🚀 **Option 1: Dev Container (Recommended for Development)**

The fastest way to start developing! No need to install PostgreSQL or Python locally.

**Prerequisites:**

- Docker Desktop
- VS Code with Dev Containers extension

**Steps:**

```bash
# Clone and open
git clone https://github.com/yourusername/canner.git
cd canner
code .

# Reopen in container (F1 → "Dev Containers: Reopen in Container")
# Wait for setup, then:
cd backend
python app.py
```

✅ **Benefits:**

- ✨ Zero configuration - everything works out of the box
- 🗄️ PostgreSQL included - no local installation needed
- 🐍 Python environment pre-configured
- 🔧 All dev tools ready (black, pylint, pytest, ipython)
- 🔄 Instant onboarding for new developers

📖 **Full guide:** [DEV_CONTAINER_SETUP.md](DEV_CONTAINER_SETUP.md)

---

### Browser Extension Installation

1. **Build the extension:**

   ```bash
   cd browser-extension
   npm run build
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `browser-extension/dist` folder

3. **Load in Firefox:**

   ```bash
   npm run test:firefox
   ```

### Backend API Setup

The backend provides a RESTful API for managing response templates:

```bash
# Health check
curl http://localhost:5000/api/health

# Get all responses
curl http://localhost:5000/api/responses

# Create a new response
curl -X POST http://localhost:5000/api/responses \
  -H "Content-Type: application/json" \
  -d '{"title": "Professional Thanks", "content": "Thank you for your message!", "tags": ["professional", "gratitude"]}'
```

## 🏗️ **Architecture**

```text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Browser        │    │  Backend API     │    │  Database       │
│  Extension      │◄──►│  (Flask)         │◄──►│  (PostgreSQL/   │
│  (TypeScript)   │    │                  │    │   SQLite)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Components Overview:**

- **🌐 Browser Extension**: TypeScript-based Chrome/Firefox extension with content scripts
- **⚙️ Backend API**: Python Flask application with auto-retry database connections
- **🗄️ Database**: PostgreSQL (production) or SQLite (development) with automatic migrations
- **🐳 Docker**: Containerized services with health checks and volume persistence

## 🛠️ **Development**

### Hot Reload Development

The project supports hot reload for both frontend and backend:

```bash
# Backend hot reload
cd backend
export FLASK_ENV=development
python app.py

# Extension hot reload
cd browser-extension
npm run dev
```

### Database Management

```bash
# Reset database
docker-compose down --volumes
docker-compose up --build

# View logs
docker-compose logs backend
docker-compose logs postgres

# Database shell
docker-compose exec postgres psql -U developer -d canner_dev
```

### Testing

```bash
# Backend API tests
cd backend
python -m pytest tests/

# Extension testing
cd browser-extension
npm test

# Integration testing
npm run test:extension
```

## � **API Documentation**

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check with database status |
| `GET` | `/api/responses` | Get all responses (supports `?search=query`) |
| `POST` | `/api/responses` | Create new response |
| `GET` | `/api/responses/:id` | Get specific response |
| `PUT` | `/api/responses/:id` | Update response |
| `DELETE` | `/api/responses/:id` | Delete response |

### Response Format

```json
{
  "id": "uuid-string",
  "title": "Response Title",
  "content": "Response content here...",
  "tags": ["tag1", "tag2"],
  "created_at": "2025-10-03T12:00:00Z",
  "updated_at": "2025-10-03T12:00:00Z"
}
```

## 🔧 **Configuration**

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///responses.db` |
| `FLASK_ENV` | Flask environment | `production` |
| `FLASK_DEBUG` | Enable debug mode | `false` |

### Browser Extension Settings

The extension automatically detects platform contexts and adapts its behavior:

- **LinkedIn**: Blue theme, professional positioning
- **Twitter/X**: White theme, compact design
- **Universal**: Adaptive design for other sites

## 📄 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🔐 **Security**

- All database connections use secure connection strings
- No sensitive data is stored in browser storage
- API endpoints include proper validation and sanitization
- Docker containers run with non-root users

For security issues, please see our [Security Policy](SECURITY.md).

## � **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 **Support**

- 📧 **Email**: [baivab@techtutorialswithpiyush.com](mailto:baivab@techtutorialswithpiyush.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/canner/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/canner/discussions)

Made with ❤️ for developers who type the same things repeatedly
