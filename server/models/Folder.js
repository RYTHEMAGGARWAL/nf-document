const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  path: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    default: 0 // 0 for root folders, 1 for subfolders
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
folderSchema.index({ parentId: 1 });
folderSchema.index({ path: 1 });

module.exports = mongoose.model('Folder', folderSchema);
