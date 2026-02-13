'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class aiReportCache extends Model {
  
    static associate(models) {
      // Forecast cache belongs to a company
      aiReportCache.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      // Optional associations for location, product, category
      aiReportCache.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location',
        constraints: false
      });

      aiReportCache.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        constraints: false
      });

      aiReportCache.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category',
        constraints: false
      });
    }
  }

  aiReportCache.init({
    cache_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'company_id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'location_id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'product_id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'category_id'
      }
    },
    historical_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 365,
      validate: {
        min: 1,
        max: 1095 // Max 3 years
      }
    },
    cache_key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    forecast_data: {
      type: DataTypes.JSON,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'aiReportCache',
    tableName: 'forecast_cache',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['cache_key']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['company_id', 'location_id', 'product_id', 'category_id', 'historical_days']
      }
    ],
    hooks: {
      beforeValidate: (aiReportCache, options) => {
        // Auto-expire old entries
        if (aiReportCache.expires_at && new Date(aiReportCache.expires_at) < new Date()) {
          // This should ideally be cleaned up by a background job, but we can mark it here
        }
      }
    }
  });

  return aiReportCache;
};

