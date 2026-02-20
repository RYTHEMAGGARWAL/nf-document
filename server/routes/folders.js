const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const File = require('../models/File');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const fs = require('fs-extra');
const path = require('path');

// @route   GET /api/folders
// @desc    Get all folders (hierarchical structure)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const folders = await Folder.find().sort({ order: 1, name: 1 });
    
    // Build hierarchical structure
    const rootFolders = folders.filter(f => f.parentId === null);
    const folderTree = rootFolders.map(root => {
      const children = folders.filter(f => 
        f.parentId && f.parentId.toString() === root._id.toString()
      );
      return {
        ...root.toObject(),
        children
      };
    });

    res.json({
      success: true,
      folders: folderTree
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/folders
// @desc    Create new folder
// @access  Private (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Folder name is required' 
      });
    }

    let path = name;
    let level = 0;

    if (parentId) {
      const parent = await Folder.findById(parentId);
      if (!parent) {
        return res.status(404).json({ 
          success: false, 
          message: 'Parent folder not found' 
        });
      }
      path = `${parent.path}/${name}`;
      level = parent.level + 1;
    }

    const folder = new Folder({
      name,
      parentId: parentId || null,
      path,
      level,
      createdBy: req.user._id
    });

    await folder.save();

    // Create physical folder in OneDrive
    const oneDrivePath = process.env.ONEDRIVE_PATH;
    const folderPath = path.join(oneDrivePath, path);
    await fs.ensureDir(folderPath);

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/folders/:id
// @desc    Update folder
// @access  Private (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Folder not found' 
      });
    }

    if (name) {
      const oldPath = folder.path;
      const newPath = folder.parentId 
        ? `${(await Folder.findById(folder.parentId)).path}/${name}`
        : name;

      folder.name = name;
      folder.path = newPath;

      await folder.save();

      // Update all child folders
      const childFolders = await Folder.find({ 
        path: { $regex: `^${oldPath}/` } 
      });

      for (const child of childFolders) {
        child.path = child.path.replace(oldPath, newPath);
        await child.save();
      }

      // Update all files in this folder
      await File.updateMany(
        { folderPath: oldPath },
        { folderPath: newPath }
      );
    }

    res.json({
      success: true,
      message: 'Folder updated successfully',
      folder
    });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/folders/:id
// @desc    Delete folder
// @access  Private (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Folder not found' 
      });
    }

    // Check if folder has files
    const fileCount = await File.countDocuments({ folderId: folder._id });
    if (fileCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete folder with files. Please delete files first.' 
      });
    }

    // Check if folder has subfolders
    const childCount = await Folder.countDocuments({ parentId: folder._id });
    if (childCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete folder with subfolders. Please delete subfolders first.' 
      });
    }

    await Folder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/folders/initialize
// @desc    Initialize default folder structure
// @access  Private (Admin only)
router.post('/initialize', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check if folders already exist
    const count = await Folder.countDocuments();
    if (count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Folder structure already initialized' 
      });
    }

    // Default folder structure from original app
    const defaultStructure = [
      { name: 'Direct Tax', children: ['Income Tax', 'TDS Returns', 'Income Tax Returns', 'Income Tax Assessments', 'Power of Attorney'] },
      { name: 'Indirect Tax - GST', children: [] },
      { name: "Co'Law", children: ['ROC Compliances', 'Board Resolution Copy', 'Minute Books'] },
      { name: 'RBI', children: ['Annual Compliances', 'Financials', 'Returns'] },
      { name: 'SEBI Compliances', children: [] },
      { name: 'Statutory Docs', children: [] },
      { name: 'Balance Sheet', children: ['Directors Report', 'Financial Statement / SOA', 'Audit / Tax Audit Report'] },
      { name: 'Admin', children: ['Agreements', 'Demat Holding and CML', 'GIFT', 'Insurance payment', 'Lease Data', 'Loan given and/or taken', 'PPF Payment', 'PPF Statement', 'Rent Receipt'] },
      { name: 'Finance', children: ['Bank Statements', 'Banking Details', 'Credit Card Statements', 'Credit Rating Agency', 'Donation', 'Fixed Deposit', 'Forex Transactions', 'Moveable Assets Addition / Sale'] },
      { name: 'Operations', children: ['Fixed Assets Addition / Sale', 'MF, PMS, Bond, CG state.', 'Property Documents', 'Related Party Transaction', 'Trust Deeds'] }
    ];

    const oneDrivePath = process.env.ONEDRIVE_PATH;
    await fs.ensureDir(oneDrivePath);

    for (let i = 0; i < defaultStructure.length; i++) {
      const mainFolder = new Folder({
        name: defaultStructure[i].name,
        parentId: null,
        path: defaultStructure[i].name,
        level: 0,
        order: i,
        createdBy: req.user._id
      });

      await mainFolder.save();

      // Create physical folder
      await fs.ensureDir(path.join(oneDrivePath, mainFolder.name));

      // Create subfolders
      for (let j = 0; j < defaultStructure[i].children.length; j++) {
        const childName = defaultStructure[i].children[j];
        const childFolder = new Folder({
          name: childName,
          parentId: mainFolder._id,
          path: `${mainFolder.path}/${childName}`,
          level: 1,
          order: j,
          createdBy: req.user._id
        });

        await childFolder.save();

        // Create physical subfolder
        await fs.ensureDir(path.join(oneDrivePath, mainFolder.name, childName));
      }
    }

    res.json({
      success: true,
      message: 'Folder structure initialized successfully'
    });
  } catch (error) {
    console.error('Initialize folders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
