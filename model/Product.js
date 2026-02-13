'use strict';
const { Model } = require('sequelize');
const { VALIDATION, DEFAULTS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
  
    static associate(models) {
      // Product belongs to a company
      Product.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      // Product belongs to a category
      Product.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });

      // Product has many inventory records
      Product.hasMany(models.Inventory, {
        foreignKey: 'product_id',
        as: 'inventory'
      });

      // Product has many stock movements
      Product.hasMany(models.StockMovement, {
        foreignKey: 'product_id',
        as: 'stockMovements'
      });

      // Product has many POS sale items
      if (models.PosSaleItem) {
        Product.hasMany(models.PosSaleItem, {
          foreignKey: 'product_id',
          as: 'posSaleItems'
        });
      }

      if (models.SupplierProduct) {
        Product.hasMany(models.SupplierProduct, {
          foreignKey: 'product_id',
          as: 'supplierLinks'
        });

        Product.belongsToMany(models.Supplier, {
          through: models.SupplierProduct,
          foreignKey: 'product_id',
          otherKey: 'supplier_id',
          as: 'suppliers'
        });
      }
    }
  }

  Product.init({
    product_id: {
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'category_id'
      }
    },
    sku: {
      type: DataTypes.STRING(VALIDATION.PRODUCT_SKU_MAX_LENGTH),
      allowNull: true,
      unique: true,
      validate: {
        len: [0, VALIDATION.PRODUCT_SKU_MAX_LENGTH]
      }
    },
    name: {
      type: DataTypes.STRING(VALIDATION.PRODUCT_NAME_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: [VALIDATION.PRODUCT_NAME_MIN_LENGTH, VALIDATION.PRODUCT_NAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, VALIDATION.PRODUCT_DESCRIPTION_MAX_LENGTH]
      }
    },
    unit: {
      type: DataTypes.STRING(VALIDATION.PRODUCT_UNIT_MAX_LENGTH),
      allowNull: true,
      defaultValue: DEFAULTS.PRODUCT_UNIT,
      validate: {
        len: [0, VALIDATION.PRODUCT_UNIT_MAX_LENGTH]
      }
    },
    cost_price: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    selling_price: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['sku'],
        unique: true
      },
      {
        fields: ['name']
      }
    ]
  });

  return Product;
};
