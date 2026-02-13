'use strict';

const express = require('express');
const FileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

// Apply authentication to all file routes
router.use(authMiddleware);

// POST /api/files - Upload logo and store file path
router.post(
  '/',
  uploadMiddleware,
  FileController.createFile
);

// GET /api/files/:filename - Get file by filename
router.get(
  '/:filename',
  FileController.getFileByFilename
);

// DELETE /api/files/:filename - Delete file by filename
router.delete(
  '/:filename',
  FileController.deleteFile
);

module.exports = router;

