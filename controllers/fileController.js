'use strict';

const fileService = require('../services/fileService');
const activityTrack = require('../utils/activityTrack');

/**
 * File Controller
 * Handles HTTP requests for file operations
 */
class FileController {
  /**
   * Get file by filename
   * GET /api/files/:filename
   */
  static async getFileByFilename(req, res) {
    try {
      const { filename } = req.params;

      const file = await fileService.getByFilename(filename);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('file', file.id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      // Generate full URL for response
      const protocol = req.protocol;
      const host = req.get('host');
      const fullUrl = `${protocol}://${host}/uploads/${file.file_url}`;

      res.status(200).json({
        success: true,
        message: 'File retrieved successfully',
        data: {
          ...file.toJSON(),
          full_url: fullUrl // Full URL for client use
        }
      });
    } catch (error) {
      console.error('Get file by filename error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving file'
      });
    }
  }

  /**
   * Upload logo and store file path
   * POST /api/files
   */
  static async createFile(req, res) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please select an image file.'
        });
      }

      const uploaded_by = req.user?.user_id;
      const { alt_text } = req.body;

      // Store only the filename in database
      const file_url = req.file.filename;

      // Create file record in database
      const file = await fileService.create({
        file_url,
        alt_text: alt_text || req.file.originalname,
        uploaded_by
      });

      // Log create activity
      try {
        await activityTrack.created('file', file.id, {
          userId: req.user?.user_id,
          description: { 
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        });
      } catch (e) {
        // non-blocking
      }

      // Generate full URL for response (not stored in DB)
      const protocol = req.protocol;
      const host = req.get('host');
      const fullUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          ...file.toJSON(),
          full_url: fullUrl, // Full URL for client use
          fileInfo: {
            originalname: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        }
      });
    } catch (error) {
      console.error('Upload file error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while uploading file'
      });
    }
  }

  /**
   * Delete file by filename
   * DELETE /api/files/:filename
   */
  static async deleteFile(req, res) {
    try {
      const { filename } = req.params;

      const file = await fileService.getByFilename(filename);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Delete physical file from disk
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../uploads', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await fileService.delete(file.id);

      // Log delete activity
      try {
        await activityTrack.deleted('file', file.id, {
          userId: req.user?.user_id,
          description: { file_url: file.file_url, filename }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting file'
      });
    }
  }
}

module.exports = FileController;

