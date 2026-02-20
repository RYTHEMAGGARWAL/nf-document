const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  referenceNumber: {
    type: String,
    required: true,
    unique: true  // This already creates an index, no need for separate index
  },
  size: {
    type: Number,
    required: true
  },
  sizeFormatted: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true
  },
  folderPath: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByUsername: {
    type: String,
    required: true
  },
  oneDrivePath: {
    type: String,
    required: true
  },
  syncedToOneDrive: {
    type: Boolean,
    default: false
  },
  copilotProcessed: {
    type: Boolean,
    default: false
  },
  summary: {
    type: String,
    default: ''
  },
  aiAnalysis: {
    type: String,
    default: ''
  },
  aiAnalyzedAt: {
    type: Date
  },
  aiAnalyzedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster searches
// REMOVED: fileSchema.index({ referenceNumber: 1 }); // Already indexed via unique: true
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ folderId: 1 });
fileSchema.index({ name: 'text', originalName: 'text' });

module.exports = mongoose.model('File', fileSchema);