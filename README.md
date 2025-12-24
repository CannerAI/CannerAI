# CannerAI - AI-Powered LinkedIn & Twitter Assistant

> 🚀 A sophisticated browser extension and backend system that enhances your social media productivity with AI-powered response suggestions and seamless content management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg)](https://python.org)

## ✨ Features
- Select from a variety of pre-defined response templates
- Format linkedin post with Ease

## 🏗 Architecture

Here’s an overview of how **Canner** works internally:

![Architecture Diagram](./docs/architecture-diagram.svg)

## 📄 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.
- Join our Discord community for discussions and support. [Join Discord](https://discord.com/invite/the-cloudops-community-1030513521122885642)


## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- MongoDB Atlas account (free tier) OR local MongoDB
- Node.js 18+ (for browser extension development)
- Chrome or Firefox browser

### 1. Set Up MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free M0 tier available)
3. Create a database user with read/write permissions
4. Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/`)
5. Whitelist your IP address in Network Access

👉 **New to MongoDB Atlas?** Follow our detailed [MongoDB Atlas Setup Guide](docs/MONGODB_SETUP_GUIDE.md)

**Option B: Local MongoDB**
1. Install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB: `sudo systemctl start mongod`
3. Your connection string will be: `mongodb://localhost:27017/`

### 2. Configure Backend

```bash
# Navigate to backend directory
cd backend

# Copy environment example file
cp .env.example .env.development

# Edit .env.development with your MongoDB credentials
# For Atlas: DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/
# For Local: DATABASE_URL=mongodb://localhost:27017/
```

### 3. Start the Application

```bash
# From project root
docker compose up --build

# Backend will be available at http://localhost:5000
# Test it: curl http://localhost:5000/api/health
```

### 4. Build & Install Browser Extension

```bash
# Navigate to extension directory
cd browser-extension

# Install dependencies and build
npm install
npm run build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the browser-extension/dist/ folder
```

### 5. Verify Setup

Follow the [Setup Verification Guide](SETUP_VERIFICATION.md) to ensure everything is working correctly.

A detailed Quick Start is written in our [Contributing Guide](CONTRIBUTING.md). You can go through it for more details. 


## **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 **Support**

- 📧 **Email**: [baivab@techtutorialswithpiyush.com](mailto:baivab@techtutorialswithpiyush.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/piyushsachdeva/canner/issues)
- 💬 **Discord**: [Join our Discord](https://discord.com/invite/the-cloudops-community-1030513521122885642)

Made with ❤️ for developers who type the same things repeatedly
