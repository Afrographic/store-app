'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SlowMovingCache extends Model {
    static associate(models) {
      SlowMovingCache.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      SlowMovingCache.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location',
        constraints: false
      });

      SlowMovingCache.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        constraints: false
      });

      SlowMovingCache.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category',
        constraints: false
      });
    }
  }

  SlowMovingCache.init({
    cache_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    analysis_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 180
    },
    cache_key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    alert_data: {
      type: DataTypes.JSON,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'SlowMovingCache',
    tableName: 'slow_moving_cache',
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

  return SlowMovingCache;
};


