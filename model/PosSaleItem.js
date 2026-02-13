'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class PosSaleItem extends Model {
  
    static associate(models) {
      // PosSaleItem belongs to a POS sale
      PosSaleItem.belongsTo(models.PosSale, {
        foreignKey: 'sale_id',
        as: 'sale'
      });

      // PosSaleItem belongs to a product
      PosSaleItem.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });
    }
  }

  PosSaleItem.init({
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pos_sales',
        key: 'sale_id'
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
      allowNull: false,
      validate: {
        min: 0,
        notEmpty: true
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: false,
      validate: {
        min: 0,
        notEmpty: true
      }
    },
    discount: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tax: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    line_total: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: false,
      validate: {
        min: 0,
        notEmpty: true
      }
    }
  }, {
    sequelize,
    modelName: 'PosSaleItem',
    tableName: 'pos_sale_items',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['sale_id']
      },
      {
        fields: ['product_id']
      }
    ]
  });

  return PosSaleItem;
};

