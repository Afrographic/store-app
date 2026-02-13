'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SupplierProduct extends Model {
    static associate(models) {
      SupplierProduct.belongsTo(models.Supplier, {
        foreignKey: 'supplier_id',
        as: 'supplier'
      });

      SupplierProduct.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });

      SupplierProduct.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });
    }
  }

  SupplierProduct.init({
    supplier_product_id: {
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
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'supplier_id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'product_id'
      }
    }
  }, {
    sequelize,
    modelName: 'SupplierProduct',
    tableName: 'supplier_products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['supplier_id']
      },
      {
        fields: ['product_id']
      },
      {
        unique: true,
        fields: ['supplier_id', 'product_id']
      }
    ]
  });

  return SupplierProduct;
};

