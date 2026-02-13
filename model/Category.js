'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
  
    static associate(models) {
      // Category belongs to a company
      Category.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      // Category has many products
      Category.hasMany(models.Product, {
        foreignKey: 'category_id',
        as: 'products'
      });
    }
  }

  Category.init({
    category_id: {
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
      type: DataTypes.STRING(VALIDATION.CATEGORY_NAME_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: [VALIDATION.CATEGORY_NAME_MIN_LENGTH, VALIDATION.CATEGORY_NAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, VALIDATION.CATEGORY_DESCRIPTION_MAX_LENGTH]
      }
    }
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
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
      }
    ]
  });

  return Category;
};
