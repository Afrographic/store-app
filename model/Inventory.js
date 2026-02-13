'use strict';
const { Model } = require('sequelize');
const { VALIDATION, DEFAULTS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Inventory extends Model {
  
    static associate(models) {
      // Inventory belongs to a location
      Inventory.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location'
      });

      // Inventory belongs to a product
      Inventory.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });
    }
  }

  Inventory.init({
    inventory_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'location_id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'product_id'
      }
    },
    quantity: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: true,
      defaultValue: DEFAULTS.QUANTITY,
      validate: {
        min: 0
      }
    },
    reserved_quantity: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: true,
      defaultValue: DEFAULTS.RESERVED_QUANTITY,
      validate: {
        min: 0
      }
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Inventory',
    tableName: 'inventory',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['location_id']
      },
      {
        fields: ['product_id']
      },
      {
        fields: ['location_id', 'product_id'],
        unique: true
      }
    ]
  });

  return Inventory;
};
