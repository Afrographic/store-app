'use strict';
const { Model } = require('sequelize');
const { VALIDATION, ENUMS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class StockMovement extends Model {
  
    static associate(models) {
      // StockMovement belongs to a product
      StockMovement.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });

      // StockMovement belongs to a location
      StockMovement.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location'
      });

      // StockMovement belongs to a user (created by)
      StockMovement.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
  }

  StockMovement.init({
    movement_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'product_id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'location_id'
      }
    },
    quantity: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: false,
      validate: {
        notEmpty: true,
        min: 0.01 // Ensure positive quantity
      }
    },
    movement_type: {
      type: DataTypes.ENUM(...ENUMS.MOVEMENT_TYPE),
      allowNull: false,
      validate: {
        isIn: [ENUMS.MOVEMENT_TYPE]
      },
      comment: 'IN: Stock coming in, OUT: Stock going out'
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the related record (pos_sale_id, adjustment_id, etc.)'
    },
    reference_type: {
      type: DataTypes.ENUM(...ENUMS.REFERENCE_TYPE),
      allowNull: true,
      validate: {
        isIn: [ENUMS.REFERENCE_TYPE]
      },
      comment: 'Type of reference: POS_SALE, POS_RETURN, ADJUSTMENT, TRANSFER, OPENING_STOCK'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    }
  }, {
    sequelize,
    modelName: 'StockMovement',
    tableName: 'stock_movements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['product_id']
      },
      {
        fields: ['location_id']
      },
      {
        fields: ['movement_type']
      },
      {
        fields: ['reference_id']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return StockMovement;
};
