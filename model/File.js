'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
  
    static associate(models) {
      // File belongs to a user (optional - uploaded_by)
      File.belongsTo(models.User, {
        foreignKey: 'uploaded_by',
        as: 'uploader'
      });
    }
  }

  File.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    file_url: {
      type: DataTypes.STRING(VALIDATION.FILE_URL_MAX_LENGTH),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'File URL cannot be empty'
        },
        len: {
          args: [VALIDATION.FILE_URL_MIN_LENGTH, VALIDATION.FILE_URL_MAX_LENGTH],
          msg: 'File URL must be between 1 and 500 characters'
        }
      }
    },
    alt_text: {
      type: DataTypes.STRING(VALIDATION.FILE_ALT_TEXT_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: {
          args: [0, VALIDATION.FILE_ALT_TEXT_MAX_LENGTH],
          msg: 'Alt text must be 255 characters or less'
        }
      }
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      validate: {
        isInt: {
          msg: 'Uploaded by must be an integer'
        },
        min: {
          args: [1],
          msg: 'Uploaded by must be greater than 0'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'File',
    tableName: 'files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['uploaded_by']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['file_url']
      }
    ],
    hooks: {
      beforeCreate: async (file) => {
        // Trim file URL
        if (file.file_url) {
          file.file_url = file.file_url.trim();
        }
        
        // Trim alt text
        if (file.alt_text) {
          file.alt_text = file.alt_text.trim();
        }
      },
      beforeUpdate: async (file) => {
        // Trim file URL
        if (file.changed('file_url') && file.file_url) {
          file.file_url = file.file_url.trim();
        }
        
        // Trim alt text
        if (file.changed('alt_text') && file.alt_text) {
          file.alt_text = file.alt_text.trim();
        }
      }
    }
  });

  return File;
};
