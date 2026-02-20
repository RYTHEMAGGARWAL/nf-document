# Quick Start Guide - NF Document Repository

## 🚀 Get Started in 5 Minutes!

### Prerequisites
- Node.js installed (v18+)
- MongoDB Atlas account
- OneDrive installed

### Step 1: Clone/Download Project
```bash
# Extract the zip file or clone the repository
cd nf-document-repository
```

### Step 2: Setup Backend (2 minutes)
```bash
cd server
npm install
copy .env.example .env    # Windows
# OR
cp .env.example .env      # Mac/Linux
```

Edit `server/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/nf-repository
JWT_SECRET=change-this-to-a-random-secret-key
ONEDRIVE_PATH=C:\Users\rythe\OneDrive\NIIT NF
```

Start backend:
```bash
npm start
```

### Step 3: Setup Frontend (2 minutes)
Open new terminal:
```bash
cd client
npm install
npm run dev
```

### Step 4: Login & Initialize
1. Open browser: `http://localhost:5173`
2. Login:
   - Username: `admin`
   - Password: `admin123`
3. Go to "Manage Folders" → Click "Initialize Default Structure"
4. Done! 🎉

### Step 5: Test Upload
1. Go to "Files" tab
2. Select a folder from dropdown
3. Click "Upload File"
4. Choose a file
5. Check OneDrive folder!

## Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**User:**
- Username: `user1`
- Password: `user123`

⚠️ **Change these passwords immediately!**

## Common Commands

### Backend
```bash
cd server
npm start          # Start server
npm run dev        # Start with auto-reload (needs nodemon)
```

### Frontend
```bash
cd client
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Quick Troubleshooting

**Backend won't start?**
- Check MongoDB connection string
- Ensure port 5000 is free

**Frontend won't connect?**
- Ensure backend is running
- Check `VITE_API_URL` in client/.env

**Can't upload files?**
- Initialize folder structure first
- Check OneDrive path in server/.env
- Ensure OneDrive is syncing

## What's Next?

1. ✅ Change default passwords
2. ✅ Create more users (Admin → Users)
3. ✅ Upload test files
4. ✅ Explore dashboard and statistics
5. ✅ Configure settings

## File Structure Created in OneDrive

```
C:\Users\rythe\OneDrive\NIIT NF\
├── Direct Tax\
│   ├── Income Tax\
│   ├── TDS Returns\
│   └── ... (5 subfolders)
├── Indirect Tax - GST\
├── Co'Law\
├── RBI\
└── ... (10 main folders total)
```

## Features Overview

### For All Users:
- 📤 Upload files
- 📥 Download files
- 📊 View dashboard statistics
- 🔍 Search files
- 👤 Manage own profile

### For Admins Only:
- 👥 Create/Edit/Delete users
- 🗂️ Manage folder structure
- ⚙️ Configure system settings
- 📈 View all statistics

## Need Help?

1. Check INSTALLATION.md for detailed setup
2. Check README.md for project overview
3. Review error messages in terminal
4. Verify all environment variables are set

## Architecture

```
┌─────────────────┐
│   React.js      │  (Frontend - Port 5173)
│   + Vite        │
└────────┬────────┘
         │
         ↓ HTTP/REST API
┌────────┴────────┐
│   Express.js    │  (Backend - Port 5000)
│   + Node.js     │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│MongoDB │ │ OneDrive │
│ Atlas  │ │  Folder  │
└────────┘ └──────────┘
```

## Security Notes

🔒 **Before Production:**
1. Change JWT_SECRET to a strong random string
2. Change all default passwords
3. Enable HTTPS
4. Restrict MongoDB IP access
5. Set NODE_ENV=production
6. Never commit .env files

---

🎉 **You're all set! Start uploading documents!**

For detailed documentation, see INSTALLATION.md and README.md
