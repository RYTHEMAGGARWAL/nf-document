# NF Document Repository - Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB Atlas Account** - [Sign Up](https://www.mongodb.com/cloud/atlas)
- **Git** (optional) - [Download](https://git-scm.com/)
- **OneDrive** installed and synced on your computer

## Step-by-Step Installation

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new account or sign in
3. Create a new cluster (Free tier is sufficient for testing)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/`)
7. Replace `<password>` with your database user password
8. Add `/nf-repository` at the end of the connection string

Example connection string:
```
mongodb+srv://admin:mypassword@cluster0.abc123.mongodb.net/nf-repository?retryWrites=true&w=majority
```

### 2. Backend Setup

1. Open terminal/command prompt
2. Navigate to the server folder:
   ```bash
   cd server
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create `.env` file:
   ```bash
   # On Windows
   copy .env.example .env
   
   # On Mac/Linux
   cp .env.example .env
   ```

5. Edit `.env` file with your details:
   ```env
   MONGODB_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_secret_key_here_make_it_random_and_secure
   PORT=5000
   ONEDRIVE_PATH=C:\Users\rythe\OneDrive\NIIT NF
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

   **Important:** 
   - Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
   - Change `JWT_SECRET` to a long random string for security
   - Update `ONEDRIVE_PATH` if your OneDrive is in a different location

6. Start the backend server:
   ```bash
   npm start
   ```

   You should see:
   ```
   ✅ MongoDB Connected Successfully
   ✅ Default admin user created
   ✅ Default regular user created
   Server running on port 5000
   ```

### 3. Frontend Setup

1. Open a NEW terminal/command prompt (keep the backend running)
2. Navigate to the client folder:
   ```bash
   cd client
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create `.env` file:
   ```bash
   # On Windows
   copy .env.example .env
   
   # On Mac/Linux
   cp .env.example .env
   ```

5. The default `.env` should work, but verify it contains:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

6. Start the frontend development server:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   VITE v5.0.8  ready in 500 ms
   ➜  Local:   http://localhost:5173/
   ```

### 4. Access the Application

1. Open your browser
2. Go to: `http://localhost:5173`
3. You should see the login screen

### 5. First Login

Use these default credentials:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Regular User Account:**
- Username: `user1`
- Password: `user123`

**IMPORTANT:** Change these passwords immediately in production!

### 6. Initialize Folder Structure

1. Log in as admin
2. Go to "Manage Folders" tab
3. Click "Initialize Default Structure"
4. Wait for confirmation
5. Check your OneDrive folder at `C:\Users\rythe\OneDrive\NIIT NF`
6. All folders should now be created

## Verification Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 5173
- [ ] MongoDB Atlas connected successfully
- [ ] Can log in with admin credentials
- [ ] Folder structure initialized
- [ ] OneDrive folders created
- [ ] Can upload a test file
- [ ] Can view uploaded file in OneDrive

## Common Issues and Solutions

### Issue 1: MongoDB Connection Error

**Error:** `MongoServerError: bad auth`

**Solution:**
- Verify your MongoDB connection string is correct
- Check username and password
- Ensure your IP address is whitelisted in MongoDB Atlas:
  1. Go to Network Access in MongoDB Atlas
  2. Click "Add IP Address"
  3. Click "Allow Access from Anywhere" (for testing)

### Issue 2: Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
- Change the PORT in server/.env to a different number (e.g., 5001)
- Or kill the process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:5000 | xargs kill -9
  ```

### Issue 3: OneDrive Path Not Found

**Error:** `ENOENT: no such file or directory`

**Solution:**
- Verify OneDrive is installed and synced
- Check the path in server/.env matches your actual OneDrive location
- Common paths:
  - `C:\Users\YourUsername\OneDrive\NIIT NF`
  - `C:\Users\YourUsername\OneDrive - Company\NIIT NF`

### Issue 4: CORS Error

**Error:** `Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy`

**Solution:**
- Ensure backend server is running
- Verify FRONTEND_URL in server/.env matches your frontend URL
- Restart the backend server

### Issue 5: npm install fails

**Error:** `npm ERR! code ENOENT`

**Solution:**
- Ensure you're in the correct directory (server or client)
- Delete node_modules and package-lock.json, then try again:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

## Next Steps

1. **Change Default Passwords**
   - Log in as admin
   - Go to Users tab
   - Edit each user and change passwords

2. **Create Additional Users**
   - Go to Users tab
   - Click "Create User"
   - Fill in details

3. **Upload Test Files**
   - Go to Files tab
   - Select a folder
   - Click "Upload File"

4. **Configure OneDrive**
   - Ensure OneDrive is syncing properly
   - Check files appear in OneDrive after upload

## Production Deployment

For production deployment, you'll need to:

1. Set `NODE_ENV=production` in server/.env
2. Build the frontend: `npm run build` in client folder
3. Serve the built files with a web server (nginx, Apache, etc.)
4. Use environment variables for secrets (never commit .env files)
5. Set up HTTPS
6. Configure proper CORS policies
7. Set up regular backups of MongoDB
8. Monitor server logs

## Support

If you encounter any issues:

1. Check the console logs (browser and terminal)
2. Verify all environment variables are set correctly
3. Ensure all services are running
4. Check MongoDB Atlas network access settings

## Security Recommendations

1. **Change Default Credentials:** Immediately change admin and user passwords
2. **JWT Secret:** Use a strong, random JWT_SECRET in production
3. **MongoDB:** Restrict IP access in MongoDB Atlas to your server's IP only
4. **HTTPS:** Always use HTTPS in production
5. **Environment Variables:** Never commit .env files to version control
6. **Regular Updates:** Keep all dependencies updated
7. **Backups:** Set up automated MongoDB backups

---

Created: 2025-02-14
Version: 1.0.0
