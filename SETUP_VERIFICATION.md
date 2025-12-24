# Setup Verification Guide

Use this guide to verify that your CannerAI setup is working correctly.

## ✅ Backend Verification

### 1. Check Backend Health

```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T...",
  "database": "MongoDB",
  "database_connected": true
}
```

### 2. Test Creating a Canned Response

```bash
curl -X POST http://localhost:5000/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome Message",
    "content": "Thank you for connecting! Looking forward to our conversation.",
    "tags": ["greeting", "networking"]
  }'
```

**Expected Response:** 201 Created with response object including an `id` field

### 3. Test Retrieving Responses

```bash
curl http://localhost:5000/api/responses
```

**Expected Response:** Array of response objects (should include the one you just created)

### 4. Test Search Functionality

```bash
curl "http://localhost:5000/api/responses?search=welcome"
```

**Expected Response:** Array containing responses matching "welcome"

## ✅ MongoDB Verification

### Using MongoDB Compass

1. Open MongoDB Compass
2. Connect using your connection string
3. Navigate to database: `cannerai_db` (or `cannerai_dev`)
4. You should see collection: `canned_responses`
5. Click on the collection to view documents
6. Check the "Indexes" tab - you should see 4 indexes:
   - `_id_` (default)
   - `idx_canned_responses_text_search`
   - `idx_canned_responses_tags`
   - `idx_canned_responses_created_at`
   - `idx_canned_responses_updated_at`

### Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Switch to database
use cannerai_db

# Check collections
show collections
# Should show: canned_responses

# View documents
db.canned_responses.find().pretty()

# Count documents
db.canned_responses.countDocuments()

# View indexes
db.canned_responses.getIndexes()
```

## ✅ Browser Extension Verification

### 1. Check Extension Installation

1. Open Chrome extensions page: `chrome://extensions/`
2. Verify "Canner" extension is loaded and enabled
3. Check that there are no error messages

### 2. Test Extension on LinkedIn

1. Go to [LinkedIn](https://www.linkedin.com)
2. Navigate to Messages or try to create a post
3. You should see:
   - 💬 "Quick Response" button in message compose areas
   - Ability to select text and save as canned response
   - Keyboard shortcut: `Ctrl+Shift+L` or `Cmd+Shift+L` works

### 3. Check Extension Popup

1. Click the extension icon in browser toolbar
2. Popup should open showing:
   - Search bar
   - List of saved responses
   - "Add New" button
3. Try adding a new response through the popup

### 4. Check Browser Console

1. Open DevTools (F12) on LinkedIn
2. Go to Console tab
3. Look for: `Canner: Content script loaded`
4. Should NOT see any error messages

## 🐛 Common Issues

### Backend Won't Start

**Issue:** `Failed to connect to MongoDB`

**Solutions:**
- Verify MongoDB connection string in `.env.development`
- For Atlas: Check if your IP is whitelisted
- For Local: Ensure MongoDB is running: `sudo systemctl status mongod`

### Database Connection Timeout

**Issue:** `ServerSelectionTimeoutError`

**Solutions:**
- Check network connectivity
- Verify credentials are correct
- Ensure MongoDB Atlas cluster is not paused (free tier pauses after inactivity)

### Extension Not Loading

**Issue:** Extension appears in chrome://extensions but doesn't work

**Solutions:**
- Rebuild the extension: `cd browser-extension && npm run build`
- Remove and re-add the extension
- Check browser console for errors
- Verify backend is running: `curl http://localhost:5000/api/health`

### CORS Errors

**Issue:** Browser console shows CORS policy errors

**Solutions:**
- Verify backend is running on port 5000
- Check that flask-cors is installed: `pip list | grep flask-cors`
- Restart the backend service

## 📊 Performance Checks

### Database Performance

```javascript
// In mongosh, test query performance
use cannerai_db

// Should use text index (fast)
db.canned_responses.find({ $text: { $search: "welcome" } }).explain("executionStats")

// Check execution time should be < 100ms for small datasets
```

### API Response Times

```bash
# Test API response time
time curl http://localhost:5000/api/responses

# Should complete in < 1 second
```

## ✅ All Systems Go!

If all checks pass:
- ✅ Backend is running and healthy
- ✅ MongoDB is connected and indexed
- ✅ Browser extension is loaded and functional
- ✅ API endpoints are responding correctly

You're ready to use CannerAI! 🎉

## 🆘 Need Help?

If you encounter issues not covered here:
1. Check [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup instructions
2. Review backend logs: `docker compose logs -f backend`
3. Open an issue: [GitHub Issues](https://github.com/CannerAI/CannerAI/issues)
4. Join our Discord: [Discord Community](https://discord.com/invite/the-cloudops-community-1030513521122885642)
