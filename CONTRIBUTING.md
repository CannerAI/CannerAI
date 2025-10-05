# Contributing to Canner

We love your input! We want to make contributing to Canner as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## 📋 Requirements

Before you start contributing, ensure you have the following installed:

### Required

- **Docker** (v20.10+)

  - Required for running the full application stack
  - Download from [docker.com](https://www.docker.com/get-started)

- **Python** (v3.8+)

  - Required for backend development
  - Download from [python.org](https://www.python.org/downloads/)

- **Node.js** (v18+)

  - Required for browser extension development
  - Download from [nodejs.org](https://nodejs.org/)

- **Git**
  - Required for version control
  - Download from [git-scm.com](https://git-scm.com/)

### Recommended MUST

- **VS Code** - Recommended IDE with extensions for TypeScript and Python
- **Chrome/Firefox** - For testing the browser extension

## 🚀 Quick Start for Contributors

**Fork and clone the repository:**

```bash
git clone https://github.com/yourusername/canner.git
cd canner
```

### Building up Backend

1. **Set up the development environment:**

   ```bash
   - Using Dev Containers
     Press F2 then: Dev Containers: Rebuild and Reopen in Containers

   
   cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python app.py
   ```

### Building up Frontend

```bash
cd browser-extension

# Install dependencies
sudo npm install

# Build for production
sudo npm run build

```

This creates a `dist/` folder with the compiled extension files:

```
dist/
├── background.js        # Background service worker
├── content.js          # Content script for LinkedIn
├── content.css         # Styles for injected UI
├── popup.html          # Extension popup interface
├── popup.js            # Popup React app
├── manifest.json       # Extension manifest
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

### Load Extension in Chrome

1. **Open Chrome Extensions page:**

   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode:**

   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension:**

   - Click "Load unpacked" button
   - Navigate to and select the `browser-extension/dist/` folder
   - Click "Select Folder"

4. **Verify Installation:**
   - Extension should appear in the extensions list
   - Look for "Canner" with version 1.0.0
   - Pin the extension to toolbar for easy access

### Load Extension in Firefox

1. **Open Firefox Add-ons Debug page:**

   ```
   about:debugging#/runtime/this-firefox
   ```

2. **Load Temporary Add-on:**

   - Click "Load Temporary Add-on" button
   - Navigate to `browser-extension/dist/` folder
   - Select the `manifest.json` file
   - Click "Open"

3. **Verify Installation:**
   - Extension should appear in the temporary extensions list
   - Check the browser toolbar for the extension icon

### Test the Extension

1. **Navigate to LinkedIn:**

   ```
   https://www.linkedin.com/
   ```

2. **Test Features:**

   - Look for "💬 Quick Response" buttons on message boxes
   - Select any text to see the "+" save button appear
   - Press `Ctrl+Shift+L` in message boxes for quick access
   - Click extension icon to open the popup interface

3. **Check Console for Errors:**
   - Open DevTools (F12)
   - Check Console tab for any error messages
   - Look for "Canner: Content script loaded" message

## 🐛 Bug Reports

### Good Bug Reports Include:

1. **Clear title** and description
2. **Steps to reproduce** the issue
3. **Expected vs actual behavior**
4. **Environment details** (OS, browser, version)
5. **Screenshots or videos** if applicable

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- OS: [e.g. Windows 10, macOS 12]
- Browser: [e.g. Chrome 119, Firefox 120]
- Extension Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

## 💡 Feature Requests

### Good Feature Requests Include:

1. **Clear problem statement**
2. **Proposed solution**
3. **Alternative solutions considered**
4. **Use cases and examples**

## 🤝 Community Guidelines

### Code of Conduct

- **Be respectful** and inclusive
- **Be constructive** in feedback
- **Help others** learn and contribute
- **Stay on topic** in discussions

## ✅ Do's and ❌ Don'ts

### ✅ Do's

- **Do** search existing issues before creating a new one
- **Do** provide detailed information in bug reports and feature requests
- **Do** test your changes thoroughly before submitting a PR
- **Do** follow the code style and conventions used in the project
- **Do** write clear commit messages that explain what and why
- **Do** update documentation when you change functionality
- **Do** be patient and respectful when waiting for reviews
- **Do** ask questions if you're unsure about something
- **Do** link related issues in your PRs
- **Do** keep PRs focused on a single feature or fix

### ❌ Don'ts

- **Don't** create duplicate issues without checking existing ones first
- **Don't** submit spam, low-effort, or placeholder issues/PRs
- **Don't** create issues like "Please assign me" or "+1" comments
- **Don't** make PRs with only whitespace or formatting changes without prior discussion
- **Don't** submit incomplete or untested code
- **Don't** create multiple issues for the same problem
- **Don't** hijack existing issues with unrelated topics
- **Don't** demand immediate responses or reviews
- **Don't** use offensive or inappropriate language
- **Don't** copy code without proper attribution
- **Don't** submit AI-generated PRs without understanding and testing the code

### Getting Help

- **Join Our Community**: [Discord](https://discord.com/invite/the-cloudops-community-1030513521122885642)
- 🐛 **Issues**: [GitHub Issues](https://github.com/piyushsachdeva/canner/issues)

## 📜 License

By contributing to Canner, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Canner! 🎉
