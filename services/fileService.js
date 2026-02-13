'use strict';

const { File, User } = require('../model');
const { Op } = require('sequelize');

/**
 * File Service
 * Business logic for file operations
 */
module.exports = {
  /**
   * Get file by filename
   * Searches for file_url containing the filename
   */
  async getByFilename(filename) {
    try {
      const file = await File.findOne({
        where: {
          file_url: {
            [Op.like]: `%${filename}%`
          }
        },
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['user_id', 'username', 'full_name', 'email']
          }
        ]
      });

      return file;
    } catch (error) {
      throw new Error(`Failed to fetch file: ${error.message}`);
    }
  },

  /**
   * Create new file record
   */
  async create(data) {
    try {
      const file = await File.create(data);
      
      // Fetch file with uploader info
      const fileWithUploader = await File.findByPk(file.id, {
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['user_id', 'username', 'full_name', 'email']
          }
        ]
      });

      return fileWithUploader;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }
      throw new Error(`Failed to create file: ${error.message}`);
    }
  },

  /**
   * Delete file by ID
   */
  async delete(id) {
    try {
      const deletedCount = await File.destroy({
        where: { id }
      });

      return deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
};

