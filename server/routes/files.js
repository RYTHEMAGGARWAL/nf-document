const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const Folder = require('../models/Folder');
const Settings = require('../models/Settings');
const { authMiddleware } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get next reference number
async function getNextReferenceNumber() {
  let settings = await Settings.findOne({ key: 'referenceCounter' });
  
  if (!settings) {
    settings = new Settings({
      key: 'referenceCounter',
      value: 1000,
      description: 'Auto-incrementing reference number for files'
    });
    await settings.save();
  }

  const refNumber = `NF${settings.value}`;
  settings.value += 1;
  await settings.save();

  return refNumber;
}

// @route   GET /api/files
// @desc    Get all files
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { folderId, search } = req.query;
    
    let query = {};
    
    if (folderId) {
      query.folderId = folderId;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const files = await File.find(query)
      .populate('uploadedBy', 'username')
      .populate('folderId', 'name path')
      .sort({ uploadDate: -1 });

    res.json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/files/upload
// @desc    Upload file
// @access  Private
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { folderId } = req.body;

    if (!folderId) {
      // Clean up uploaded file
      await fs.remove(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Folder ID is required' 
      });
    }

    // Get folder details
    const folder = await Folder.findById(folderId);
    
    if (!folder) {
      await fs.remove(req.file.path);
      return res.status(404).json({ 
        success: false, 
        message: 'Folder not found' 
      });
    }

    // Generate reference number
    const referenceNumber = await getNextReferenceNumber();

    // Create new filename with reference number
    const ext = path.extname(req.file.originalname);
    const newFileName = `${referenceNumber}_${req.file.originalname}`;

    // Move file to OneDrive folder
    const oneDrivePath = process.env.ONEDRIVE_PATH;
    const destPath = path.join(oneDrivePath, folder.path, newFileName);
    await fs.move(req.file.path, destPath, { overwrite: true });

    // Create file record
    const file = new File({
      name: newFileName,
      originalName: req.file.originalname,
      referenceNumber,
      size: req.file.size,
      sizeFormatted: formatFileSize(req.file.size),
      type: req.file.mimetype,
      folderId: folder._id,
      folderPath: folder.path,
      uploadedBy: req.user._id,
      uploadedByUsername: req.user.username,
      oneDrivePath: destPath,
      syncedToOneDrive: true,
      copilotProcessed: false // Can be enhanced with AI processing
    });

    await file.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file
    });
  } catch (error) {
    console.error('Upload file error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      await fs.remove(req.file.path).catch(err => console.error('Error removing temp file:', err));
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

// @route   GET /api/files/:id
// @desc    Get single file
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'username')
      .populate('folderId', 'name path');

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    res.json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

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

// @route   DELETE /api/files/:id
// @desc    Delete file
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Check if user is admin or file owner
    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this file' 
      });
    }

    // Delete physical file
    if (await fs.pathExists(file.oneDrivePath)) {
      await fs.remove(file.oneDrivePath);
    }

    // Delete database record
    await File.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/files/stats/dashboard
// @desc    Get file statistics for dashboard
// @access  Private
router.get('/stats/dashboard', authMiddleware, async (req, res) => {
  try {
    const totalFiles = await File.countDocuments();
    const userFiles = await File.countDocuments({ uploadedBy: req.user._id });
    
    // Get files by folder
    const filesByFolder = await File.aggregate([
      {
        $group: {
          _id: '$folderId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'folders',
          localField: '_id',
          foreignField: '_id',
          as: 'folder'
        }
      },
      {
        $unwind: '$folder'
      },
      {
        $project: {
          folderName: '$folder.name',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get recent files
    const recentFiles = await File.find()
      .populate('uploadedBy', 'username')
      .populate('folderId', 'name')
      .sort({ uploadDate: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalFiles,
        userFiles,
        filesByFolder,
        recentFiles
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/files/analyze/:id
// @desc    Analyze file with AI (Claude/ChatGPT)
// @access  Private
router.post('/analyze/:id', authMiddleware, async (req, res) => {
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
        message: 'File not found on disk' 
      });
    }

    // Generate AI analysis using Claude or ChatGPT
    const analysis = await generateRealAIAnalysis(file);

    file.aiAnalysis = analysis;
    file.aiAnalyzedAt = new Date();
    file.aiAnalyzedBy = req.user._id;
    await file.save();

    res.json({
      success: true,
      message: 'AI analysis completed',
      analysis
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during analysis' 
    });
  }
});

// Real AI Analysis using Claude, ChatGPT, Gemini (FREE), or Hugging Face (FREE)
async function generateRealAIAnalysis(file) {
  try {
    // Choose AI service
    const AI_SERVICE = process.env.AI_SERVICE || 'gemini'; // 'claude', 'openai', 'gemini', 'huggingface'
    
    // Read file content
    const fileContent = await readFileContent(file);
    
    if (AI_SERVICE === 'claude') {
      return await analyzeWithClaude(file, fileContent);
    } else if (AI_SERVICE === 'openai') {
      return await analyzeWithChatGPT(file, fileContent);
    } else if (AI_SERVICE === 'gemini') {
      return await analyzeWithGemini(file, fileContent);
    } else if (AI_SERVICE === 'huggingface') {
      return await analyzeWithHuggingFace(file, fileContent);
    } else {
      return generateBasicAnalysis(file);
    }
  } catch (error) {
    console.error('AI Analysis error:', error);
    // Fallback to basic analysis if AI fails
    return generateBasicAnalysis(file);
  }
}

// Claude AI Analysis
async function analyzeWithClaude(file, fileContent) {
  const fetch = require('node-fetch');
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const prompt = `Analyze this document and provide observations in bullet points:

File Name: ${file.originalName}
File Type: ${file.type}
File Size: ${file.sizeFormatted}
Folder: ${file.folderPath}

${fileContent ? `File Content Preview:\n${fileContent.substring(0, 3000)}` : 'Content not available for this file type'}

Please provide:
1. Document type and purpose
2. Key observations about the content
3. Compliance or storage recommendations
4. Any important dates or deadlines mentioned
5. Security or access recommendations
6. Overall quality and completeness assessment

Format each point with an emoji and keep it concise.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Claude API error');
  }

  return data.content[0].text;
}

// ChatGPT Analysis
async function analyzeWithChatGPT(file, fileContent) {
  const fetch = require('node-fetch');
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Analyze this document and provide observations in bullet points:

File Name: ${file.originalName}
File Type: ${file.type}
File Size: ${file.sizeFormatted}
Folder: ${file.folderPath}

${fileContent ? `File Content Preview:\n${fileContent.substring(0, 3000)}` : 'Content not available for this file type'}

Please provide:
1. Document type and purpose
2. Key observations about the content
3. Compliance or storage recommendations
4. Any important dates or deadlines mentioned
5. Security or access recommendations
6. Overall quality and completeness assessment

Format each point with an emoji and keep it concise.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI API error');
  }

  return data.choices[0].message.content;
}

// Google Gemini Analysis (FREE!)
async function analyzeWithGemini(file, fileContent) {
  const fetch = require('node-fetch');
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured - Get free at https://makersuite.google.com/app/apikey');
  }

  const prompt = `Analyze this document and provide observations in bullet points:

File Name: ${file.originalName}
File Type: ${file.type}
File Size: ${file.sizeFormatted}
Folder: ${file.folderPath}

${fileContent ? `File Content Preview:\n${fileContent.substring(0, 3000)}` : 'Content not available for this file type'}

Please provide:
1. Document type and purpose
2. Key observations about the content
3. Compliance or storage recommendations
4. Any important dates or deadlines mentioned
5. Security or access recommendations
6. Overall quality and completeness assessment

Format each point with an emoji and keep it concise.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini API error');
  }

  return data.candidates[0].content.parts[0].text;
}

// Hugging Face Analysis (FREE!)
async function analyzeWithHuggingFace(file, fileContent) {
  const fetch = require('node-fetch');
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured - Get free at https://huggingface.co/settings/tokens');
  }

  const prompt = `Analyze this document and provide observations in bullet points:

File Name: ${file.originalName}
File Type: ${file.type}
File Size: ${file.sizeFormatted}
Folder: ${file.folderPath}

${fileContent ? `File Content Preview:\n${fileContent.substring(0, 2000)}` : 'Content not available'}

Provide: document type, key observations, compliance recommendations, dates, security tips, quality assessment. Use emojis.`;

  const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HF_API_KEY}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        return_full_text: false
      }
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Hugging Face API error');
  }

  return data[0].generated_text;
}

// Read file content based on type
async function readFileContent(file) {
  try {
    const filePath = file.oneDrivePath;
    const fileType = file.type;

    // Text files
    if (fileType.includes('text') || fileType.includes('plain')) {
      return await fs.readFile(filePath, 'utf8');
    }

    // PDF files
    if (fileType.includes('pdf')) {
      const pdfParse = require("pdf-parse");
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    }

    // Word documents
    if (fileType.includes('word') || fileType.includes('document')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    // Excel files
    if (fileType.includes('sheet') || fileType.includes('excel')) {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_txt(sheet);
    }

    // For other file types, return metadata only
    return null;
  } catch (error) {
    console.error('Error reading file content:', error);
    return null;
  }
}

// Fallback basic analysis (if AI fails)
function generateBasicAnalysis(file) {
  const fileType = file.type;
  const fileName = file.originalName.toLowerCase();
  
  let analysis = [];
  
  // Document type analysis
  if (fileType.includes('pdf')) {
    analysis.push('📄 Document Type: PDF - Suitable for archival and official records');
  } else if (fileType.includes('word') || fileType.includes('doc')) {
    analysis.push('📝 Document Type: Word Document - Editable format');
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    analysis.push('📊 Document Type: Spreadsheet - Contains tabular data');
  }

  // File name analysis
  if (fileName.includes('tax') || fileName.includes('itr')) {
    analysis.push('💰 Category: Tax Document - Requires secure storage and backup');
    analysis.push('⚠️ Compliance: Ensure retention for 7+ years as per tax regulations');
  }
  
  if (fileName.includes('balance') || fileName.includes('financial')) {
    analysis.push('💼 Category: Financial Document - Highly confidential');
    analysis.push('🔒 Security: Restrict access to authorized personnel only');
  }

  if (fileName.includes('contract') || fileName.includes('agreement')) {
    analysis.push('📋 Category: Legal Document - Review expiry dates');
    analysis.push('✅ Action: Set reminder for contract renewal');
  }

  if (fileName.includes('invoice') || fileName.includes('bill')) {
    analysis.push('🧾 Category: Invoice/Bill - Track payment status');
    analysis.push('💡 Tip: Cross-reference with accounting records');
  }

  // Size analysis
  if (file.size > 10 * 1024 * 1024) {
    analysis.push('📦 File Size: Large file (>10MB) - Consider compression');
  }

  // Folder context
  if (file.folderPath.includes('Direct Tax')) {
    analysis.push('📂 Location: Direct Tax folder - Ensure proper categorization');
  }

  // General suggestions
  analysis.push('✨ AI Suggestion: Document appears to be properly categorized');
  analysis.push('🔍 Recommendation: Verify document completeness before archival');
  
  return analysis.join('\n');
}

module.exports = router;