# API Documentation - NF Document Repository

Base URL: `http://localhost:5000/api`

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Authentication Endpoints

### POST /auth/login
Login user and get JWT token

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "role": "admin",
    "status": "active"
  }
}
```

### GET /auth/me
Get current authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "role": "admin",
    "status": "active"
  }
}
```

### POST /auth/change-password
Change user password

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## User Endpoints (Admin Only)

### GET /users
Get all users

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "admin",
      "role": "admin",
      "status": "active",
      "createdAt": "2025-02-14T10:00:00.000Z"
    }
  ]
}
```

### POST /users
Create new user

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "user",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "newuser",
    "role": "user",
    "status": "active"
  }
}
```

### PUT /users/:id
Update user

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "updatedname",
  "password": "newpassword",  // optional
  "role": "admin",
  "status": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "updatedname",
    "role": "admin",
    "status": "inactive"
  }
}
```

### DELETE /users/:id
Delete user

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### GET /users/:id
Get single user

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "username": "admin",
    "role": "admin",
    "status": "active"
  }
}
```

## Folder Endpoints

### GET /folders
Get all folders (hierarchical structure)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "folders": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Direct Tax",
      "parentId": null,
      "path": "Direct Tax",
      "level": 0,
      "children": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Income Tax",
          "parentId": "507f1f77bcf86cd799439013",
          "path": "Direct Tax/Income Tax",
          "level": 1
        }
      ]
    }
  ]
}
```

### POST /folders
Create new folder (Admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Folder",
  "parentId": "507f1f77bcf86cd799439013"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Folder created successfully",
  "folder": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "New Folder",
    "path": "Direct Tax/New Folder",
    "level": 1
  }
}
```

### PUT /folders/:id
Update folder (Admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Folder Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Folder updated successfully",
  "folder": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Updated Folder Name",
    "path": "Direct Tax/Updated Folder Name"
  }
}
```

### DELETE /folders/:id
Delete folder (Admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Folder deleted successfully"
}
```

### POST /folders/initialize
Initialize default folder structure (Admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Folder structure initialized successfully"
}
```

## File Endpoints

### GET /files
Get all files

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `folderId` (optional): Filter by folder ID
- `search` (optional): Search in file names

**Response:**
```json
{
  "success": true,
  "count": 5,
  "files": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "name": "NF1000_document.pdf",
      "originalName": "document.pdf",
      "referenceNumber": "NF1000",
      "size": 1024000,
      "sizeFormatted": "1.00 MB",
      "type": "application/pdf",
      "folderId": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Direct Tax"
      },
      "uploadedBy": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "admin"
      },
      "uploadDate": "2025-02-14T10:00:00.000Z",
      "syncedToOneDrive": true
    }
  ]
}
```

### POST /files/upload
Upload file

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload
- `folderId`: Target folder ID

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "_id": "507f1f77bcf86cd799439017",
    "name": "NF1001_newdoc.pdf",
    "referenceNumber": "NF1001",
    "originalName": "newdoc.pdf",
    "size": 2048000,
    "sizeFormatted": "2.00 MB"
  }
}
```

### GET /files/:id
Get single file

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "file": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "NF1000_document.pdf",
    "originalName": "document.pdf",
    "referenceNumber": "NF1000",
    "oneDrivePath": "C:\\Users\\rythe\\OneDrive\\NIIT NF\\Direct Tax\\NF1000_document.pdf"
  }
}
```

### GET /files/download/:id
Download file

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
File download stream

### DELETE /files/:id
Delete file

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### GET /files/stats/dashboard
Get dashboard statistics

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 25,
    "userFiles": 10,
    "filesByFolder": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "folderName": "Direct Tax",
        "count": 15
      }
    ],
    "recentFiles": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "name": "NF1000_document.pdf",
        "uploadDate": "2025-02-14T10:00:00.000Z"
      }
    ]
  }
}
```

## Health Check

### GET /health
Check if server is running

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "version": "1.0.0",
  "timestamp": "2025-02-14T10:00:00.000Z"
}
```

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "success": false,
  "message": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding it for production.

## File Upload Limits

- Maximum file size: 50MB
- Allowed file types: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, jpg, jpeg, png, gif, zip, rar

---

For more information, see the main README.md
