'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Log extends Model {
  
    static associate(models) {
      // Log belongs to a user (optional)
      Log.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  Log.init({
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      validate: {
        isInt: {
          msg: 'User ID must be an integer'
        },
        min: {
          args: [1],
          msg: 'User ID must be greater than 0'
        }
      }
    },
    action: {
      type: DataTypes.STRING(VALIDATION.LOG_ACTION_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: {
          args: [0, VALIDATION.LOG_ACTION_MAX_LENGTH],
          msg: 'Action must be 255 characters or less'
        }
      }
    },
    entity_type: {
      type: DataTypes.STRING(VALIDATION.LOG_ENTITY_TYPE_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: {
          args: [0, VALIDATION.LOG_ENTITY_TYPE_MAX_LENGTH],
          msg: 'Entity type must be 50 characters or less'
        }
      }
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'Entity ID must be an integer'
        },
        min: {
          args: [1],
          msg: 'Entity ID must be greater than 0'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, VALIDATION.LOG_DESCRIPTION_MAX_LENGTH],
          msg: 'Description is too long'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Log',
    tableName: 'logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['entity_type']
      },
      {
        fields: ['entity_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['user_id', 'created_at']
      }
    ],
    hooks: {
      beforeCreate: async (log) => {
        // Convert action to lowercase for consistency
        if (log.action) {
          log.action = log.action.toLowerCase();
        }
        
        // Convert entity_type to lowercase for consistency
        if (log.entity_type) {
          log.entity_type = log.entity_type.toLowerCase();
        }
      }
    }
  });

  return Log;
};
