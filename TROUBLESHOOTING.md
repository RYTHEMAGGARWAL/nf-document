# Troubleshooting Guide - NF Document Repository

## Common Issues & Solutions

### 🔴 Issue 1: File Download Not Working

**Error:** "Failed to download files"

**Possible Causes & Solutions:**

#### Solution 1: Check OneDrive Path
```bash
# Verify the OneDrive path exists
# Windows PowerShell:
Test-Path "C:\Users\rythe\OneDrive\NIIT NF"

# If false, update server/.env with correct path
```

#### Solution 2: Check File Permissions
- Ensure the server has read access to OneDrive folder
- Right-click OneDrive folder → Properties → Security
- Make sure your user has "Read" permissions

#### Solution 3: Restart Servers
```bash
# Backend
cd server
# Press Ctrl+C to stop
npm start

# Frontend  
cd client
# Press Ctrl+C to stop
npm run dev
```

#### Solution 4: Check Browser Console
- Open browser Dev Tools (F12)
- Go to Console tab
- Look for errors
- Common errors:
  - CORS error → Check backend CORS settings
  - 404 error → File not found on disk
  - 401 error → Token expired, login again

#### Solution 5: Verify File Upload
- Check if file actually exists in OneDrive:
  ```
  C:\Users\rythe\OneDrive\NIIT NF\[Folder Name]\NF1000_filename.ext
  ```
- If file is missing, upload it again

---

### 🔴 Issue 2: File Upload Failing

**Error:** Upload not working or shows error

**Solutions:**

#### Check File Size
- Maximum file size: 50MB
- Reduce file size if larger

#### Check File Type
Allowed types:
- Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt
- Images: jpg, jpeg, png, gif
- Archives: zip, rar

#### Check Folder Selection
- Select a folder from dropdown before uploading
- If no folders, initialize folder structure first

#### Check Server Logs
```bash
# Check backend terminal for errors
# Look for:
# - "Error uploading file"
# - "ENOENT: no such file or directory"
```

---

### 🔴 Issue 3: Cannot Login

**Error:** Invalid credentials or login not working

**Solutions:**

#### Reset to Default Users
1. Stop backend server (Ctrl+C)
2. Delete users from MongoDB:
   - Go to MongoDB Atlas
   - Browse Collections
   - Delete all documents from `users` collection
3. Restart backend - default users will be recreated

#### Check MongoDB Connection
```bash
# Check server/.env
MONGODB_URI=mongodb+srv://...

# Look for error in terminal:
# "MongoDB Connection Error"
```

#### Clear Browser Data
- Clear localStorage
- Open Dev Tools (F12)
- Application → Local Storage → Clear All
- Refresh page

---

### 🔴 Issue 4: Folders Not Showing

**Error:** No folders in dropdown or sidebar

**Solutions:**

#### Initialize Folder Structure
1. Login as admin
2. Go to "Manage Folders" tab
3. Click "Initialize Default Structure"
4. Wait for success message

#### Check MongoDB
- Go to MongoDB Atlas
- Browse Collections → `folders`
- Should have 40 documents (10 main + 30 sub)

---

### 🔴 Issue 5: CORS Error

**Error:** "Access blocked by CORS policy"

**Solutions:**

#### Check Backend is Running
```bash
# Should see:
# Server running on port 5000
```

#### Check CORS Configuration
File: `server/server.js`
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

#### Verify Frontend URL
File: `server/.env`
```env
FRONTEND_URL=http://localhost:5173
```

---

### 🔴 Issue 6: Port Already in Use

**Error:** "EADDRINUSE: address already in use :::5000"

**Solutions:**

#### Windows:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID 12345 /F
```

#### Mac/Linux:
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
```

#### Or Change Port:
File: `server/.env`
```env
PORT=5001
```

File: `client/.env`
```env
VITE_API_URL=http://localhost:5001/api
```

---

### 🔴 Issue 7: MongoDB Connection Failed

**Error:** "MongoServerError: bad auth"

**Solutions:**

#### Check Connection String
```env
# Correct format:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nf-repository?retryWrites=true&w=majority

# Common mistakes:
# - Forgot to replace <password>
# - Special characters in password (use URL encoding)
# - Missing database name (/nf-repository)
```

#### Check Network Access
1. Go to MongoDB Atlas
2. Network Access
3. Click "Add IP Address"
4. Select "Allow Access from Anywhere" (for testing)
5. Click Confirm

#### Create Database User
1. MongoDB Atlas → Database Access
2. Add New Database User
3. Username: your_username
4. Password: your_password (no special characters for testing)
5. Database User Privileges: Read and write to any database

---

### 🔴 Issue 8: Frontend Not Loading

**Error:** Blank page or "Cannot GET /"

**Solutions:**

#### Check Vite Server
```bash
cd client
npm run dev

# Should see:
# Local: http://localhost:5173/
```

#### Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache completely

#### Check Console for Errors
- F12 → Console
- Look for JavaScript errors

---

### 🔴 Issue 9: Environment Variables Not Working

**Solutions:**

#### Create .env Files
```bash
# Backend
cd server
copy .env.example .env    # Windows
cp .env.example .env      # Mac/Linux

# Frontend
cd client
copy .env.example .env    # Windows
cp .env.example .env      # Mac/Linux
```

#### Restart After Changes
- Always restart servers after changing .env
- Ctrl+C to stop
- npm start / npm run dev to start again

---

### 🔴 Issue 10: OneDrive Sync Issues

**Solutions:**

#### Check OneDrive Status
- Look for OneDrive icon in system tray
- Ensure it's syncing (not paused)
- Check OneDrive settings

#### Verify Path
```bash
# Check if folder exists
dir "C:\Users\rythe\OneDrive\NIIT NF"    # Windows
ls "C:\Users\rythe\OneDrive/NIIT NF"     # Mac/Linux
```

#### Create Folder Manually
```bash
# If folder doesn't exist, create it
mkdir "C:\Users\rythe\OneDrive\NIIT NF"
```

---

## 🛠️ Debug Mode

### Enable Detailed Logging

#### Backend:
Add to `server/server.js`:
```javascript
// Add after other middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

#### Frontend:
Add to API service:
```javascript
// In api.js interceptor
api.interceptors.request.use((config) => {
  console.log('API Request:', config.method, config.url);
  return config;
});
```

---

## 📞 Quick Checks

Before asking for help, verify:

- [ ] Backend server is running (port 5000)
- [ ] Frontend server is running (port 5173)
- [ ] MongoDB is connected (check terminal)
- [ ] OneDrive is syncing
- [ ] .env files are created and configured
- [ ] Logged in successfully
- [ ] Folders initialized
- [ ] Browser console has no errors
- [ ] Node.js version is 18+

---

## 🔍 Diagnostic Commands

```bash
# Check Node version
node --version
# Should be v18 or higher

# Check npm version
npm --version

# Check if ports are free
netstat -ano | findstr :5000    # Windows
lsof -i:5000                     # Mac/Linux

# Test backend health
curl http://localhost:5000/api/health

# Check MongoDB connection
# Should see "MongoDB Connected" in backend terminal
```

---

## Still Having Issues?

1. Check all console logs (backend terminal + browser console)
2. Try in incognito/private mode
3. Try different browser
4. Restart computer
5. Re-install dependencies:
   ```bash
   cd server
   rm -rf node_modules package-lock.json
   npm install
   
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| ENOENT | File/folder not found | Check path in .env |
| EADDRINUSE | Port already in use | Kill process or change port |
| 401 Unauthorized | Token invalid/expired | Login again |
| 403 Forbidden | No permission | Check user role |
| 404 Not Found | Resource missing | Check URL/ID |
| 500 Server Error | Backend crash | Check server logs |
| CORS Error | Cross-origin blocked | Check CORS config |
| Network Error | Backend not running | Start backend server |

---

Last Updated: 2025-02-14
