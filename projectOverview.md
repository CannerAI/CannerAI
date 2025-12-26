# 📚 CannerAI - Project Overview

**Created by: Samiran**  
**Date: December 25, 2025**

---

## 🎯 What is This Project?

**CannerAI** is a browser extension (like a plugin for Chrome) that helps people work faster on LinkedIn and Twitter/X. It saves their commonly used responses and suggests them automatically when they're typing. Think of it like autocomplete on your phone, but for social media posts and comments!

---

## 🧩 Main Parts of the Project

This project has **3 main components** that work together:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  1. Browser     │ ←──→ │  2. Backend     │ ←──→ │  3. Database    │
│  Extension      │      │  (API Server)   │      │  (MongoDB)      │
│  (Frontend)     │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 1️⃣ **Browser Extension (Frontend)** 📱

**Location:** `browser-extension/` folder

**What it does:**

- Shows a popup window when you click the extension icon
- Injects helper buttons into LinkedIn and Twitter pages
- Suggests saved responses as you type
- Lets you create, edit, and delete saved responses

**Key Files:**

- **`src/popup/App.tsx`** - The main popup interface (your primary work area!)
- **`src/content/content.ts`** - Code that runs ON LinkedIn/Twitter pages
- **`src/utils/api.ts`** - Handles communication with the backend
- **`public/manifest.json`** - Extension configuration

**Technology:** TypeScript + React

---

### 2️⃣ **Backend (API Server)** 🖥️

**Location:** `backend/` folder

**What it does:**

- Provides a REST API (like a waiter taking orders and bringing food)
- Stores and retrieves saved responses from database
- Searches responses by keywords
- Handles create, read, update, delete operations (CRUD)

**Key Files:**

- **`app.py`** - Main server file with all API endpoints
- **`models.py`** - Defines how data is structured
- **`database.py`** - Database connection logic

**Technology:** Python + Flask

**API Endpoints:**

```
GET    /api/responses          - Get all saved responses
POST   /api/responses          - Create new response
GET    /api/responses/:id      - Get specific response
PATCH  /api/responses/:id      - Update response
DELETE /api/responses/:id      - Delete response
GET    /api/search?q=keyword   - Search responses
```

---

### 3️⃣ **Database** 💾

**Location:** MongoDB (cloud or local)

**What it does:**

- Stores all saved responses permanently
- Each response has: title, content, tags, and timestamps

**Data Structure:**

```javascript
{
  "_id": "unique-id-12345",
  "title": "Thanks for connecting",
  "content": "Thanks for connecting! Looking forward to...",
  "tags": ["networking", "linkedin"],
  "created_at": "2025-12-25T10:30:00",
  "updated_at": "2025-12-25T10:30:00"
}
```

---

## 🔄 How Everything Works Together (The Flow)

### **Scenario 1: User Opens the Popup**

```
1. User clicks extension icon 🖱️
   ↓
2. popup/App.tsx loads 📱
   ↓
3. App calls getResponses() from api.ts 📞
   ↓
4. api.ts sends HTTP request to backend 🌐
   GET http://localhost:5000/api/responses
   ↓
5. Backend (app.py) receives request 🖥️
   ↓
6. Backend queries MongoDB database 💾
   ↓
7. Database returns all responses ⬅️
   ↓
8. Backend sends JSON response back 📤
   ↓
9. Frontend displays responses in popup ✅
```

---

### **Scenario 2: User Creates a New Response**

```
1. User fills form and clicks "Save" 📝
   ↓
2. App.tsx calls saveResponse() from api.ts
   ↓
3. api.ts sends HTTP POST request 📨
   POST http://localhost:5000/api/responses
   Body: { title: "...", content: "...", tags: [...] }
   ↓
4. Backend receives and validates data ✓
   ↓
5. Backend inserts into MongoDB 💾
   ↓
6. Database confirms insertion ✅
   ↓
7. Backend sends back the new response with ID 📤
   ↓
8. Frontend updates the list and shows success ✨
```

---

### **Scenario 3: User Types on LinkedIn**

```
1. User focuses on a text box on LinkedIn 📝
   ↓
2. content.ts (content script) detects it 👀
   ↓
3. User types some text... ⌨️
   ↓
4. content.ts sends search query to backend 🔍
   GET http://localhost:5000/api/search?q=user-text
   ↓
5. Backend searches database for matching responses 🔎
   ↓
6. Backend returns best matches 📊
   ↓
7. content.ts shows suggestion as "ghost text" 👻
   ↓
8. User presses Tab to accept, or keeps typing ✅
```

---

## 🗂️ Folder Structure Explained

```
CannerAI/
│
├── browser-extension/          # 🎨 FRONTEND (Your main work area!)
│   ├── src/
│   │   ├── popup/             # Extension popup UI
│   │   │   ├── App.tsx        # ⭐ Main React component
│   │   │   ├── popup.html     # HTML template
│   │   │   └── popup.css      # Styling
│   │   │
│   │   ├── content/           # Runs ON LinkedIn/Twitter pages
│   │   │   ├── content.ts     # Injects buttons, suggestions
│   │   │   └── content.css    # Styles for injected elements
│   │   │
│   │   ├── background/        # Background service worker
│   │   │   └── background.ts  # Handles extension lifecycle
│   │   │
│   │   ├── utils/             # Helper functions
│   │   │   └── api.ts         # API communication
│   │   │
│   │   └── welcome/           # Welcome page after install
│   │
│   ├── public/
│   │   ├── manifest.json      # Extension configuration
│   │   └── icons/             # Extension icons
│   │
│   ├── package.json           # Dependencies list
│   ├── tsconfig.json          # TypeScript config
│   └── webpack.config.js      # Build configuration
│
├── backend/                   # 🖥️ BACKEND (Python API)
│   ├── app.py                # Main Flask application
│   ├── models.py             # Data models
│   ├── database.py           # Database connection
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile           # Docker container setup
│
├── database/                 # 💾 DATABASE setup
│   └── init.js              # MongoDB initialization
│
├── nginx/                   # 🌐 Reverse proxy (optional)
│   └── nginx.conf          # Nginx configuration
│
├── docs/                    # 📖 Documentation
│   └── MONGODB_SETUP_GUIDE.md
│
├── docker-compose.yml      # 🐳 Run all services together
├── README.md               # Project introduction
├── CONTRIBUTING.md         # How to contribute
└── SETUP_VERIFICATION.md   # Testing checklist
```

---

## 🔧 Technologies Used

### Frontend (Browser Extension)

- **TypeScript** - JavaScript with types (safer code)
- **React** - UI library for building interfaces
- **Webpack** - Bundles all files together
- **Chrome Extension APIs** - Browser extension features

### Backend

- **Python 3.12** - Programming language
- **Flask** - Web framework (creates API endpoints)
- **PyMongo** - MongoDB driver for Python
- **Flask-CORS** - Allows frontend to talk to backend

### Database

- **MongoDB** - NoSQL database (stores JSON-like data)

### DevOps

- **Docker** - Containerization (packages app with dependencies)
- **Docker Compose** - Run multiple containers together
- **Nginx** - Web server / reverse proxy

---

## 🚀 How to Run the Project

### Step 1: Start Backend + Database

```bash
# From project root
docker compose up --build
# Backend runs at: http://localhost:5000
```

### Step 2: Build Browser Extension

```bash
cd browser-extension
npm install
npm run build
# Creates dist/ folder
```

### Step 3: Load Extension in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `browser-extension/dist/` folder
5. Done! ✅

---

## 🎨 Your Frontend Assignment Tasks

As the frontend developer, you'll work mainly in **`browser-extension/`**:

### Key Areas to Focus On:

1. **`src/popup/App.tsx`** - Main popup interface

   - Form for creating/editing responses
   - List display of saved responses
   - Search functionality
   - Dark mode toggle
   - Notification system

2. **`src/popup/popup.css`** - Styling

   - Layout and design
   - Dark/light theme
   - Responsive design
   - Animations

3. **`src/content/content.ts`** - Content script

   - Button injection on LinkedIn/Twitter
   - Inline suggestion system
   - Copy/edit/delete actions
   - Text formatting features

4. **`src/content/content.css`** - Content styles

   - Styling for injected elements
   - Button appearances
   - Suggestion display

5. **`src/utils/api.ts`** - API calls
   - Already handles backend communication
   - You may need to add new API functions

---

## 📊 Data Flow Summary

```
User Action → Frontend (React) → API Call (api.ts) → Backend (Flask)
    ↓                                                       ↓
Display Result ← JSON Response ← HTTP Response ← MongoDB Query
```

**Example:**

```
User clicks "Save"
  → App.tsx calls saveResponse()
    → api.ts sends POST /api/responses
      → app.py receives request
        → Inserts into MongoDB
          → Returns new response
            → api.ts receives response
              → App.tsx updates UI
                → User sees "Saved!" message ✅
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Backend not available"

**Solution:** Make sure Docker is running: `docker compose up`

### Issue 2: Extension not loading

**Solution:** Rebuild extension: `npm run build` and reload in Chrome

### Issue 3: CORS error

**Solution:** Backend already has CORS enabled. Check backend is running.

### Issue 4: Changes not appearing

**Solution:**

- For popup: Close and reopen popup
- For content script: Refresh the LinkedIn/Twitter page
- Rebuild if you changed TypeScript: `npm run build`

---

## 🎓 Key Concepts to Understand

### 1. Chrome Extension Parts

- **Popup** - Small window when you click extension icon
- **Content Script** - JavaScript that runs ON the webpage (LinkedIn, Twitter)
- **Background Script** - Runs in the background, handles events
- **Manifest** - Configuration file (permissions, icons, etc.)

### 2. API Communication

- **Frontend** makes HTTP requests (GET, POST, PATCH, DELETE)
- **Backend** responds with JSON data
- **async/await** used for handling asynchronous operations

### 3. State Management

- **useState** - React hook for component state
- **useEffect** - React hook for side effects (API calls, etc.)
- **Chrome Storage** - Local storage for offline functionality

---

## 🎯 Learning Path for You

1. **Week 1:** Understand current popup UI (App.tsx)
2. **Week 2:** Learn content script injection (content.ts)
3. **Week 3:** Understand API integration (api.ts)
4. **Week 4:** Start making improvements/features

---

## 📞 Need Help?

- Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Join Discord: [The CloudOps Community](https://discord.com/invite/the-cloudops-community-1030513521122885642)
- Read [SETUP_VERIFICATION.md](SETUP_VERIFICATION.md) to test your setup

---

## ✅ Quick Checklist

Before starting frontend work:

- [ ] Docker is installed and running
- [ ] Backend is running (`docker compose up`)
- [ ] Node.js 18+ is installed
- [ ] Extension builds successfully (`npm run build`)
- [ ] Extension loads in Chrome
- [ ] You can create/edit responses in popup
- [ ] Responses appear on LinkedIn/Twitter pages

---

## 🎉 Summary

**CannerAI** is a productivity tool that:

1. **Saves** your common responses in a database
2. **Suggests** them as you type on social media
3. **Syncs** across devices using a backend API

**Your job (Frontend):**

- Work on the browser extension UI
- Make it beautiful and user-friendly
- Connect user actions to backend API
- Test on LinkedIn and Twitter

**Tech Stack:** React + TypeScript + Chrome APIs

---

Good luck with your frontend development, Samiran! 🚀

**Questions?** Read this document again or check other .md files in the project.
