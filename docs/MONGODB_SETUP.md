# MongoDB Atlas Setup Guide

Complete step-by-step guide to set up MongoDB Atlas for the Heart to Heart Devotional App.

## Prerequisites

- Free MongoDB Atlas account (no credit card required for free tier)
- Internet connection
- A web browser

## Step-by-Step Setup

### 1. Create a MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Click **"Try Free"** or **"Sign up"**
3. Fill in your details:
   - Email address
   - Password (strong password, 8+ characters)
   - First & Last Name
4. Check the terms of service box
5. Click **"Create your account"**

### 2. Create a Cluster

1. After signing up, you'll see the Atlas dashboard
2. Click **"Create"** (or **"Create a Deployment"**)
3. Select **"Shared Cluster"** (free tier)
4. **Choose Provider & Region:**
   - Provider: AWS (recommended)
   - Region: Choose closest to your users (e.g., `us-east-1` for US)
5. Click **"Create Cluster"**

**⏱️ Wait 3-5 minutes** for the cluster to be created

### 3. Add Database User (Authentication)

1. In the cluster dashboard, click **"Security"** in the left sidebar
2. Click **"Database Access"**
3. Click **"Add New Database User"** (green button)
4. **Create User:**
   - **Username:** `hearttoheart_app`
   - **Password:** Click "Autogenerate Secure Password" or enter your own
   - **Save this password!** Copy it to a secure location
   - Built-in Role: Select **"Atlas Admin"** (for development)
5. Click **"Add User"**

### 4. Whitelist Your IP Address

1. Click **"Security"** → **"Network Access"**
2. Click **"Add IP Address"** (green button)
3. **For Development:**
   - Select **"Allow Access from Anywhere"** (less secure but easier)
   - Or click **"Add My Current IP Address"** to use your IP
4. Click **"Confirm"**

### 5. Get Connection String

1. Go back to **"Clusters"** (main dashboard)
2. Click **"Connect"** on your cluster
3. Select **"Drivers"** (not "Compass" or "MongoDB Shell")
4. Choose **"Node.js"** driver and version **"4.x or later"**
5. Copy the connection string

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

### 6. Update `.env` File

1. Create `backend/.env` (copy from `backend/.env.example`)
2. Replace the connection string values:

```env
# Before:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname

# After (example):
MONGODB_URI=mongodb+srv://hearttoheart_app:MySecurePassword123@cluster0.abcde.mongodb.net/heart_to_heart?retryWrites=true&w=majority
```

**Important:** 
- Replace `<username>` with `hearttoheart_app`
- Replace `<password>` with your password
- Replace `<cluster>` with your actual cluster name (e.g., `cluster0.abcde`)
- Replace `dbname` with `heart_to_heart` (or your preferred database name)
- If password has special characters, URL-encode them (e.g., `@` → `%40`)

### 7. Test Connection

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create a test file `test-connection.js`:
   ```javascript
   const mongoose = require('mongoose');
   require('dotenv').config();

   mongoose.connect(process.env.MONGODB_URI)
     .then(() => {
       console.log('✅ MongoDB Connected Successfully!');
       process.exit(0);
     })
     .catch(err => {
       console.error('❌ Connection Failed:', err.message);
       process.exit(1);
     });
   ```

3. Run test:
   ```bash
   npm install mongoose dotenv
   node test-connection.js
   ```

4. Expected output:
   ```
   ✅ MongoDB Connected Successfully!
   ```

### 8. (Optional) Create Collections

You can create collections manually in the MongoDB Atlas UI:

1. Go to your cluster → **"Collections"**
2. Click **"Create Database"**
3. Database name: `heart_to_heart`
4. Collection name: `users` (or skip; they'll auto-create on first insert)

**Collections will be automatically created when the migration script runs.**

---

## Troubleshooting

### Connection Error: "MongoServerSelectionError"

**Problem:** `MongoServerSelectionError: connect ECONNREFUSED`

**Solutions:**
1. ✅ Check IP whitelist in MongoDB Atlas:
   - Go to Security → Network Access
   - Make sure your IP is whitelisted
   - Or select "Allow Access from Anywhere" (dev only)

2. ✅ Verify connection string in `.env`:
   - Check username and password
   - Check cluster name
   - Look for typos

3. ✅ Check internet connection

### Error: "Authentication failed"

**Problem:** `MongoAuthenticationError: authentication failed`

**Solutions:**
1. Verify username: `hearttoheart_app`
2. Verify password matches what you set
3. If password has special characters, make sure it's URL-encoded:
   - `@` → `%40`
   - `:` → `%3A`
   - `#` → `%23`
   - etc.

### Error: "not authorized on admin"

**Problem:** User doesn't have enough permissions

**Solution:**
- In MongoDB Atlas, go to Security → Database Access
- Edit your user
- Change role to "Atlas Admin" (for development)

### Can't Find Connection String

**Steps to locate it:**
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) and log in
2. Click your cluster
3. Click **"Connect"**
4. Select **"Drivers"**
5. Select **"Node.js"**
6. Copy the connection string

---

## Security Best Practices

### Development Only
```env
# Safe for local development
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
Network Access: "Allow Access from Anywhere"
```

### Production
```
✅ Use environment variables (not in code)
✅ Restrict Network Access to your server IP only
✅ Use strong, randomly generated password
✅ Enable VPC Peering for added security
✅ Enable encryption (Atlas handles this)
✅ Regular backups enabled
✅ MongoDB Version: Latest stable
✅ Change admin password monthly
```

---

## Next Steps

1. **Test the connection** (see Step 7 above)
2. **Verify `.env` is correct**
3. **Run backend server:**
   ```bash
   npm install
   npm run dev
   ```
4. **Check health endpoint:**
   ```bash
   curl http://localhost:5000/
   ```
5. **Proceed to Phase 2: Run migration script**
   ```bash
   npm run migrate:dry-run    # Preview what will be migrated
   npm run migrate            # Actually migrate data
   ```

---

## MongoDB Atlas Dashboard Overview

Once you're logged in, you'll see:

| Section | Purpose |
|---------|---------|
| **Clusters** | View/manage your database clusters |
| **Security** | Database users, IP whitelist, encryption |
| **Monitoring** | Performance metrics, query logs |
| **Backups** | Automated backups, restore options |
| **Performance Advisor** | Suggestions for indexes and queries |
| **Alerts** | Set up notifications for issues |

---

## Important URLs

| Purpose | URL |
|---------|-----|
| MongoDB Atlas Dashboard | https://mongodb.com/cloud/atlas |
| Your Cluster | https://mongodb.com/account/login |
| Documentation | https://docs.mongodb.com/atlas |
| Support | https://support.mongodb.com |

---

## Useful Commands

### Connect via MongoDB Shell (for debugging)

```bash
# Install mongosh (MongoDB Shell)
npm install -g mongosh

# Connect to your cluster
mongosh "mongodb+srv://hearttoheart_app:<password>@cluster.mongodb.net/heart_to_heart"

# List collections
show collections

# Count documents in a collection
db.devotionals.countDocuments()

# View one document
db.users.findOne()

# Exit
exit
```

### Monitor Connection in Node.js

```javascript
const mongoose = require('mongoose');

mongoose.connection.on('connected', () => console.log('✅ Connected'));
mongoose.connection.on('error', (err) => console.error('❌ Error:', err));
mongoose.connection.on('disconnected', () => console.log('⚠️ Disconnected'));

mongoose.connect(process.env.MONGODB_URI);
```

---

## Support & Help

- **MongoDB Docs:** https://docs.mongodb.com/atlas
- **Mongoose Docs:** https://mongoosejs.com
- **FAQ:** See `backend/README.md`
- **Reports:** Check `docs/audit-report.md` and `docs/phase-1-schema-design-report.md`

---

**Setup Complete!** 🎉

Your MongoDB Atlas cluster is ready for the migration script in Phase 2.
