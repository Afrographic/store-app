'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PriceOptimizationCache extends Model {
  
    static associate(models) {
      // Associations similar to aiReportCache
      PriceOptimizationCache.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      PriceOptimizationCache.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location',
        constraints: false
      });

      PriceOptimizationCache.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        constraints: false
      });

      PriceOptimizationCache.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category',
        constraints: false
      });
    }
  }

  PriceOptimizationCache.init({
    cache_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'companies', key: 'company_id' }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'locations', key: 'location_id' }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'products', key: 'product_id' }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'categories', key: 'category_id' }
    },
    cache_key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    optimization_data: {
      type: DataTypes.JSON,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'PriceOptimizationCache',
    tableName: 'price_optimization_cache',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['cache_key'] },
      { fields: ['expires_at'] },
      { fields: ['company_id', 'location_id', 'product_id', 'category_id'] }
    ]
  });

  return PriceOptimizationCache;
};


