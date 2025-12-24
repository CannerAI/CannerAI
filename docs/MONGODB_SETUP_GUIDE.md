# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas (cloud database) for CannerAI in just a few minutes.

## Why MongoDB Atlas?

- ✅ **Free Forever** - M0 tier provides 512MB storage at no cost
- ✅ **No Installation** - Cloud-based, accessible from anywhere
- ✅ **Automatic Backups** - Built-in data protection
- ✅ **Global Access** - Access your data from any location
- ✅ **Easy Setup** - Takes less than 5 minutes

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email or use Google/GitHub account
3. Fill in the basic information and click "Get started free"

### 2. Create a Cluster

1. After logging in, click **"Build a Database"**
2. Choose deployment type:
   - Select **"Shared"** (Free tier)
   - Choose **"M0 Sandbox"** (FREE)
3. Select a cloud provider and region:
   - **Provider:** AWS, Google Cloud, or Azure (choose closest to you)
   - **Region:** Select the region nearest to your location
4. Cluster name:
   - Keep the default name or change it (e.g., "Cluster0")
5. Click **"Create"** (this takes 1-3 minutes)

### 3. Create Database User

1. You'll see a security quickstart screen
2. Under **"How would you like to authenticate your connection?"**:
   - Choose **"Username and Password"**
   - Enter a username (e.g., `cannerai_user`)
   - Click **"Autogenerate Secure Password"** or create your own
   - ⚠️ **IMPORTANT:** Copy and save this password securely!
3. Click **"Create User"**

### 4. Set Up Network Access

1. Under **"Where would you like to connect from?"**:
   - Click **"Add My Current IP Address"** (for development)
   - For broader access, click **"Add a Different IP Address"**
     - Enter: `0.0.0.0/0` (allows access from anywhere)
     - ⚠️ Note: This is fine for development, but not recommended for production
2. Add a description (e.g., "Development Access")
3. Click **"Finish and Close"**

### 5. Get Your Connection String

1. Click **"Go to Databases"** or navigate to the Database Deployments page
2. Find your cluster and click **"Connect"**
3. Choose **"Connect your application"**
4. Select:
   - **Driver:** Python
   - **Version:** 3.12 or later
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your actual credentials

### 6. Configure CannerAI

1. Navigate to your CannerAI backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env.development
   ```

3. Edit `.env.development`:
   ```bash
   DATABASE_URL=mongodb+srv://cannerai_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=cannerai_db
   ```
   
   Replace:
   - `cannerai_user` with your username
   - `YOUR_PASSWORD` with your actual password
   - `cluster0.xxxxx` with your actual cluster address

4. Save the file

### 7. Test the Connection

```bash
# From the project root
docker compose up --build

# Or if running manually
cd backend
python app.py
```

You should see:
```
✅ MongoDB connection established
✅ Database initialized (MongoDB)
🚀 Starting Flask server on http://0.0.0.0:5000
```

### 8. Verify in MongoDB Atlas

1. Go back to MongoDB Atlas dashboard
2. Click **"Browse Collections"** on your cluster
3. You should see:
   - Database: `cannerai_db`
   - Collection: `canned_responses`
4. Click on the collection to view documents (will be empty initially)

## 🎉 You're Done!

Your MongoDB Atlas setup is complete. The CannerAI backend will automatically:
- Create the `canned_responses` collection
- Set up all necessary indexes
- Handle connection retries if network issues occur

## Common Issues & Solutions

### Issue: "Authentication failed"

**Solution:**
- Double-check username and password
- Ensure there are no special characters that need URL encoding
- Use [URL encoder](https://www.urlencoder.org/) for special characters in password

### Issue: "Connection timeout"

**Solution:**
- Check if your IP is whitelisted in Network Access
- Try adding `0.0.0.0/0` to allow all IPs (for development)
- Verify your internet connection

### Issue: "Cluster not found"

**Solution:**
- Verify the cluster name in the connection string
- Wait a few minutes if you just created the cluster
- Check if the cluster is running (not paused)

### Issue: "Database user not found"

**Solution:**
- Go to Database Access in Atlas
- Verify the user exists and has read/write permissions
- Create a new user if needed

## Security Best Practices

### For Development
- ✅ Use `0.0.0.0/0` IP whitelist for ease of access
- ✅ Use a simple password for testing
- ✅ Keep credentials in `.env.development` (gitignored)

### For Production
- ✅ Whitelist only specific IP addresses
- ✅ Use strong, complex passwords
- ✅ Enable MongoDB Atlas encryption at rest
- ✅ Set up database monitoring and alerts
- ✅ Use environment variables, never commit credentials
- ✅ Rotate passwords regularly
- ✅ Enable Two-Factor Authentication on your Atlas account

## MongoDB Atlas Features

Once set up, explore these features:

### 1. **Data Explorer**
- Browse and edit documents
- Run queries
- View collection statistics

### 2. **Monitoring**
- View connection stats
- Check query performance
- Monitor database size

### 3. **Alerts**
- Set up alerts for connection issues
- Monitor disk space usage
- Get notified about performance issues

### 4. **Backups** (Paid tiers)
- Automatic daily backups
- Point-in-time recovery
- Download snapshots

### 5. **Performance Advisor**
- Get index recommendations
- Identify slow queries
- Optimize database performance

## Next Steps

1. ✅ Test the backend API: `curl http://localhost:5000/api/health`
2. ✅ Create your first canned response through the extension
3. ✅ View the data in MongoDB Compass or Atlas web interface
4. ✅ Follow [SETUP_VERIFICATION.md](SETUP_VERIFICATION.md) for complete testing

## Need Help?

- 📚 [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- 💬 [MongoDB Community Forums](https://www.mongodb.com/community/forums/)
- 🎮 [Join our Discord](https://discord.com/invite/the-cloudops-community-1030513521122885642)
- 🐛 [GitHub Issues](https://github.com/CannerAI/CannerAI/issues)

---

**Pro Tip:** After setup, bookmark your MongoDB Atlas dashboard for easy access to your database!
