# Canner - AI-Powered LinkedIn & Twitter Assistant

> 🚀 A sophisticated browser extension and backend system that enhances your social media productivity with AI-powered response suggestions and seamless content management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg)](https://python.org)

## ✨ Features
- Select from a variety of pre-defined response templates
- Format linked post with Ease

## 📄 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.
- Join our Discord community for discussions and support. [Join Discord](https://discord.com/invite/the-cloudops-community-1030513521122885642)


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
- 🐛 **Issues**: [GitHub Issues](https://github.com/piyushsachdeva/canner/issues)
- 💬 **Discord**: [Join our Discord](https://discord.com/invite/the-cloudops-community-1030513521122885642)

Made with ❤️ for developers who type the same things repeatedly
