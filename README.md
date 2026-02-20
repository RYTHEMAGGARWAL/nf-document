# NF Document Repository - Complete MERN Stack Application

## 🚀 Features

### Admin Features:
- ✅ Create, View, Modify, Delete Users
- ✅ Manage Folder Structure
- ✅ Access All Files
- ✅ System Settings
- ✅ OneDrive Sync Management

### User Features:
- ✅ Upload Files
- ✅ View Files
- ✅ Download Files
- ✅ Search Files
- ✅ Microsoft Copilot AI Integration

### Technical Stack:
- **Frontend**: React.js + Vite
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **File Storage**: OneDrive Integration
- **Authentication**: JWT

## 📁 Project Structure

```
nf-document-repository/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── pages/        # Page Components
│   │   ├── context/      # Context API
│   │   ├── services/     # API Services
│   │   └── App.jsx       # Main App
│   └── package.json
├── server/                # Node.js Backend
│   ├── models/           # MongoDB Models
│   ├── routes/           # API Routes
│   ├── middleware/       # Auth Middleware
│   ├── controllers/      # Controllers
│   └── server.js         # Entry Point
└── onedrive-structure/   # OneDrive Folder Structure
    └── NIIT NF/          # Main Folder
```

## 🛠️ Installation

### 1. Backend Setup

```bash
cd server
npm install
```

Create `.env` file:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_here
PORT=5000
ONEDRIVE_PATH=C:\Users\rythe\OneDrive\NIIT NF
```

### 2. Frontend Setup

```bash
cd client
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. OneDrive Setup

OneDrive folder structure will be created at:
`C:\Users\rythe\OneDrive\NIIT NF`

## 🚀 Running the Application

### Start Backend:
```bash
cd server
npm start
```

### Start Frontend:
```bash
cd client
npm run dev
```

Application will run on:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 👥 Default Login Credentials

### Admin:
- Username: `admin`
- Password: `admin123`

### User:
- Username: `user1`
- Password: `user123`

## 📂 OneDrive Folder Structure

```
NIIT NF/
├── Direct Tax/
│   ├── Income Tax/
│   ├── TDS Returns/
│   ├── Income Tax Returns/
│   ├── Income Tax Assessments/
│   └── Power of Attorney/
├── Indirect Tax - GST/
├── Co'Law/
│   ├── ROC Compliances/
│   ├── Board Resolution Copy/
│   └── Minute Books/
├── RBI/
│   ├── Annual Compliances/
│   ├── Financials/
│   └── Returns/
├── SEBI Compliances/
├── Statutory Docs/
├── Balance Sheet/
│   ├── Directors Report/
│   ├── Financial Statement / SOA/
│   └── Audit / Tax Audit Report/
├── Admin/
│   ├── Agreements/
│   ├── Demat Holding and CML/
│   ├── GIFT/
│   ├── Insurance payment/
│   ├── Lease Data/
│   ├── Loan given and/or taken/
│   ├── PPF Payment/
│   ├── PPF Statement/
│   └── Rent Receipt/
├── Finance/
│   ├── Bank Statements/
│   ├── Banking Details/
│   ├── Credit Card Statements/
│   ├── Credit Rating Agency/
│   ├── Donation/
│   ├── Fixed Deposit/
│   ├── Forex Transactions/
│   └── Moveable Assets Addition / Sale/
└── Operations/
    ├── Fixed Assets Addition / Sale/
    ├── MF, PMS, Bond, CG state./
    ├── Property Documents/
    ├── Related Party Transaction/
    └── Trust Deeds/
```

## 🔐 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Role-based Access Control
- Secure File Upload
- CORS Protection

## 📝 API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - Register user (Admin only)

### Users (Admin Only)
- GET `/api/users` - Get all users
- POST `/api/users` - Create user
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

### Files
- GET `/api/files` - Get all files
- POST `/api/files/upload` - Upload file
- DELETE `/api/files/:id` - Delete file
- GET `/api/files/download/:id` - Download file

### Folders
- GET `/api/folders` - Get folder structure
- POST `/api/folders` - Create folder
- PUT `/api/folders/:id` - Update folder
- DELETE `/api/folders/:id` - Delete folder

## 🤖 Microsoft Copilot Integration

The system includes AI-powered features:
- Auto file categorization
- Smart folder suggestions
- Document summary generation

## 📱 Responsive Design

- Desktop optimized
- Mobile friendly
- Tablet support

## 🔄 Auto-Sync Features

- Automatic OneDrive sync
- Real-time file tracking
- Background synchronization

## Created by: Your Name
## Version: 1.0.0
## Last Updated: 2025-02-14
