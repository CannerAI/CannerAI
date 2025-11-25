# Canner Browser Extension

A powerful Chrome/Firefox extension that enhances your LinkedIn experience with saved responses, templates, and productivity features.

## 🎯 Features

- 💬 **Quick Responses**: Save and reuse common LinkedIn messages
- ⚡ **Instant Insert**: Click a button on any LinkedIn message box to insert saved responses
- 🔍 **Smart Search**: Find responses quickly by title, content, or tags
- ⌨️ **Keyboard Shortcuts**: Use `Ctrl+Shift+L` on LinkedIn pages for quick access
- 📋 **Copy to Clipboard**: One-click copy for any response
- 🏷️ **Tag System**: Organize responses with custom tags
- 💾 **Dual Storage**: Works with backend API or offline with local storage
- 🎨 **LinkedIn-styled UI**: Seamless integration with LinkedIn's design

## 📁 Project Structure

```
browser-extension/
├── public/
│   ├── manifest.json       # Extension manifest (Chrome/Firefox)
│   └── icons/             # Extension icons
├── src/
│   ├── popup/             # Popup interface (React)
│   │   ├── index.tsx      # Popup entry point
│   │   ├── App.tsx        # Main popup component
│   │   ├── popup.html     # Popup HTML
│   │   └── popup.css      # Popup styles
│   ├── content/           # Content scripts (inject into LinkedIn)
│   │   ├── content.ts     # Main content script
│   │   └── content.css    # Injected styles
│   ├── background/        # Background service worker
│   │   └── background.ts  # Background script
│   └── utils/             # Shared utilities
│       └── api.ts         # API client
├── package.json
├── webpack.config.js
└── tsconfig.json
```

## 🚀 Installation

### For Development

1. **Install dependencies:**

   ```bash
   cd browser-extension
   npm install
   ```

2. **Build the extension:**

   ```bash
   npm run build
   ```

   This creates a `dist` folder with the compiled extension.

3. **Load in Chrome:**

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder

4. **Load in Firefox:**
   - Open Firefox and go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in the `dist` folder

### For Development with Auto-Reload

```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

## 💡 How to Use

### 1. Save Your First Response

- Click the extension icon in your browser toolbar
- Click "➕ New" button
- Fill in:
  - **Title**: e.g., "Connection Request - Developer"
  - **Content**: Your message text
  - **Tags**: e.g., "connection, developer, networking"
- Click "Save Response"

### 2. Use on LinkedIn

**Method 1: Button Click**

- Go to LinkedIn.com
- Open any message box or connection request
- You'll see a "💬 Quick Response" button
- Click it to see your saved responses
- Click a response to insert it

**Method 2: Keyboard Shortcut**

- Focus on any LinkedIn message box
- Press `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac)
- Select a response from the menu

**Method 3: Popup**

- Click the extension icon
- Search for a response
- Click "📝 Insert" to add it to the active LinkedIn message box
- Or click "📋 Copy" to copy to clipboard

### 3. Manage Responses

- Search using the search bar in the popup
- Edit by copying, making changes, and saving as new
- Delete outdated responses with the 🗑️ button
- Organize with tags for easy filtering

## 🔧 Configuration

### Backend Integration

The extension works with the Flask backend from the main project:

1. Make sure the backend is running:

   ```bash
   cd ../backend
   python app.py
   ```

2. The extension will automatically sync with `http://localhost:5000`

3. If the backend is not available, the extension uses local Chrome storage

### Change API URL

Edit `src/utils/api.ts`:

```typescript
const API_URL = "https://your-backend-url.com";
```

## 🎨 Features in Detail

### Content Script Injection

The extension automatically injects helper buttons into:

- LinkedIn messaging interface
- Connection request message boxes
- InMail composer
- Comment sections

### Smart Response Menu

- **Search**: Type to filter responses instantly
- **Preview**: See the first 60 characters
- **Tags**: Visual tag chips for organization
- **Actions**: Insert, copy, or delete with one click

### Popup Interface

- Clean, LinkedIn-styled design
- Responsive search
- Inline form for creating responses
- Works even when not on LinkedIn

### Background Sync

- Automatically syncs with backend every 5 minutes
- Keeps local and server data in sync
- Works offline with cached data

## ⌨️ Keyboard Shortcuts

| Action                   | Shortcut               |
| ------------------------ | ---------------------- |
| Open Quick Response Menu | `Ctrl+Shift+L`         |
| Focus Search (in popup)  | Start typing           |
| Close Menu               | `Esc` or click outside |

## 🔐 Privacy & Permissions

The extension requests these permissions:

- **storage**: To save responses locally
- **activeTab**: To insert text into LinkedIn pages
- **scripting**: To inject helper buttons
- **host_permissions** (linkedin.com): To work on LinkedIn only

**Your data stays private:**

- Responses are stored locally in your browser
- Optional backend sync (you control the server)
- No third-party tracking or analytics
- No data sent anywhere except your own backend

## 🛠️ Development

### Build for Production

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Project Dependencies

- React 18 - UI framework
- TypeScript - Type safety
- Webpack - Bundler
- Chrome Extensions API - Browser integration

## 📦 Distribution

### Package for Chrome Web Store

1. Build the extension:

   ```bash
   npm run build
   ```

2. Create a zip file:

   ```bash
   cd dist
   zip -r linkedin-helper.zip *
   ```

3. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

### Package for Firefox Add-ons

1. Build the extension
2. Create a zip file (same as above)
3. Upload to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)

## 🤝 Integration with Main Project

This extension works seamlessly with the Response Saver ecosystem:

```
┌─────────────────────┐
│  VS Code Extension  │ ←→ Backend API
└─────────────────────┘
         ↑↓
┌─────────────────────┐
│    Flask Backend    │ ←→ SQLite Database
│  (localhost:5000)   │
└─────────────────────┘
         ↑↓
┌─────────────────────┐
│ Browser Extension   │ ←→ LinkedIn.com
└─────────────────────┘
```

All three components share the same backend and database!

## 🎯 Use Cases

### Recruiters

- Save job descriptions
- Connection request templates
- Follow-up messages
- Interview invitations

### Sales Professionals

- Prospecting messages
- Product introductions
- Meeting requests
- Follow-up sequences

### Job Seekers

- Connection requests to recruiters
- Thank you messages
- Application follow-ups
- Networking introductions

### Networkers

- Event follow-ups
- Introduction messages
- Referral requests
- Congratulations messages

## 🐛 Troubleshooting

### Extension doesn't appear on LinkedIn

- Make sure you've loaded the extension in Chrome/Firefox
- Refresh the LinkedIn page
- Check browser console for errors

### Responses not saving

- Check if backend is running (`http://localhost:5000/api/health`)
- Check browser console for errors
- Verify Chrome storage permissions

### Button not showing

- Refresh the LinkedIn page
- Wait a moment for page to fully load
- Check if content script is loaded (browser console)

### Backend connection issues

- Ensure backend is running on port 5000
- Check CORS settings in Flask app
- Extension will work offline with local storage

## 🔮 Roadmap

- [ ] Response categories/folders
- [ ] Response templates with variables
- [ ] Team sharing (shared response library)
- [ ] Analytics (most used responses)
- [ ] AI-powered response suggestions
- [ ] Multi-language support
- [ ] Custom keyboard shortcuts
- [ ] Profile notes and reminders
- [ ] Automated connection requests
- [ ] Message scheduling

## 📄 License

MIT License - Same as the main project

## 🙏 Acknowledgments

- Built as part of the Response Saver ecosystem
- Designed to complement the VS Code extension
- LinkedIn's design inspiration for seamless integration

---

**Made for LinkedIn power users who value their time** ⏰

Need help? Check the main [project documentation](../README.md)
