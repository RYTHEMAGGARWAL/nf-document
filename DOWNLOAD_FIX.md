# 🔧 Quick Fix for Download Issue

## Problem: "Failed to download files"

## ✅ Solution (Step by Step):

### Step 1: Stop Both Servers
```bash
# In both terminals, press Ctrl+C
```

### Step 2: Update Backend File
File: `server/routes/files.js`

Find the download route (around line 191) and make sure it looks like this:

```javascript
// @route   GET /api/files/download/:id
// @desc    Download file
// @access  Private
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Check if file exists on disk
    const fileExists = await fs.pathExists(file.oneDrivePath);
    if (!fileExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found on disk. Please check OneDrive sync.' 
      });
    }

    // Set proper headers
    res.setHeader('Content-Type', file.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', file.size);

    // Create read stream and pipe to response
    const fileStream = require('fs').createReadStream(file.oneDrivePath);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error reading file' 
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('Download file error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error during download' 
      });
    }
  }
});
```

### Step 3: Update Frontend File
File: `client/src/services/api.js`

Find the download function (around line 67) and replace with:

```javascript
  download: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/files/download/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },
```

### Step 4: Update App.jsx
File: `client/src/App.jsx`

In FilesView component, add handleDownload function (around line 295):

```javascript
  const handleDownload = async (fileId) => {
    try {
      await fileService.download(fileId);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Download failed. Please try again.' 
      });
    }
  };
```

And change the Download button to:
```javascript
<button
  className="btn btn-sm"
  onClick={() => handleDownload(file._id)}
>
  Download
</button>
```

### Step 5: Restart Servers

Backend:
```bash
cd server
npm start
```

Frontend (new terminal):
```bash
cd client
npm run dev
```

### Step 6: Test Download

1. Login to app
2. Go to Files tab
3. Click Download on any file
4. File should download! 🎉

---

## Still Not Working?

### Check OneDrive Path:

1. Open File Explorer
2. Navigate to: `C:\Users\rythe\OneDrive\NIIT NF`
3. Check if uploaded files are there
4. If folder doesn't exist, create it

### Check Server Logs:

Look in backend terminal for:
```
Download file error: ENOENT: no such file or directory
```

This means:
- File not uploaded properly, OR
- OneDrive path is wrong

**Fix:** Update `server/.env`:
```env
ONEDRIVE_PATH=C:\Users\YOUR_USERNAME\OneDrive\NIIT NF
```

### Check Browser Console:

1. Press F12
2. Go to Console tab
3. Try download again
4. Look for errors

Common errors:
- `Failed to fetch` → Backend not running
- `401 Unauthorized` → Login again
- `404 Not Found` → File doesn't exist

---

## Alternative Download Method (If Above Doesn't Work)

Replace download function in `client/src/services/api.js`:

```javascript
  download: (id) => {
    const token = localStorage.getItem('token');
    // Create a temporary form to download
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = `${API_URL}/files/download/${id}`;
    form.target = '_blank';
    
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    form.appendChild(tokenInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  },
```

And update backend route to accept token in query:

```javascript
router.get('/download/:id', async (req, res) => {
  try {
    // Get token from header or query
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).send('No authorization token');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Rest of download logic...
    const file = await File.findById(req.params.id);
    // ... continue with file download
  } catch (error) {
    res.status(500).send('Download error');
  }
});
```

---

## 📞 Need More Help?

Check TROUBLESHOOTING.md for more solutions!
