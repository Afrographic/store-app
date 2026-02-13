'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockoutImpactCache extends Model {
    static associate(models) {
      StockoutImpactCache.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      StockoutImpactCache.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location',
        constraints: false
      });

      StockoutImpactCache.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        constraints: false
      });

      StockoutImpactCache.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category',
        constraints: false
      });
    }
  }

  StockoutImpactCache.init({
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
    analysis_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 90,
      validate: {
        min: 1,
        max: 365
      }
    },
    cache_key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    impact_data: {
      type: DataTypes.JSON,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'StockoutImpactCache',
    tableName: 'stockout_impact_cache',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['cache_key'] },
      { fields: ['expires_at'] },
      { fields: ['company_id', 'location_id', 'product_id', 'category_id', 'analysis_days'] }
    ]
  });

  return StockoutImpactCache;
};

