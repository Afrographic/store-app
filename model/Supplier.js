'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
  
    static associate(models) {
      // Supplier belongs to a company
      Supplier.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      if (models.SupplierProduct) {
        Supplier.hasMany(models.SupplierProduct, {
          foreignKey: 'supplier_id',
          as: 'productLinks'
        });

        Supplier.belongsToMany(models.Product, {
          through: models.SupplierProduct,
          foreignKey: 'supplier_id',
          otherKey: 'product_id',
          as: 'products'
        });
      }
    }
  }

  Supplier.init({
    supplier_id: {
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
    name: {
      type: DataTypes.STRING(VALIDATION.SUPPLIER_NAME_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: [VALIDATION.SUPPLIER_NAME_MIN_LENGTH, VALIDATION.SUPPLIER_NAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    contact_name: {
      type: DataTypes.STRING(VALIDATION.SUPPLIER_CONTACT_NAME_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: [0, VALIDATION.SUPPLIER_CONTACT_NAME_MAX_LENGTH]
      }
    },
    email: {
      type: DataTypes.STRING(VALIDATION.SUPPLIER_EMAIL_MAX_LENGTH),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(VALIDATION.SUPPLIER_PHONE_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: [0, VALIDATION.SUPPLIER_PHONE_MAX_LENGTH]
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, VALIDATION.SUPPLIER_ADDRESS_MAX_LENGTH]
      }
    }
  }, {
    sequelize,
    modelName: 'Supplier',
    tableName: 'suppliers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['email']
      }
    ]
  });

  return Supplier;
};
