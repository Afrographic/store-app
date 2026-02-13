'use strict';
const { Model } = require('sequelize');
const { VALIDATION, DEFAULTS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
  
    static associate(models) {
      // Company has many users
      Company.hasMany(models.User, {
        foreignKey: 'company_id',
        as: 'users'
      });

      // Company has many locations
      Company.hasMany(models.Location, {
        foreignKey: 'company_id',
        as: 'locations'
      });

      // Company has many suppliers
      Company.hasMany(models.Supplier, {
        foreignKey: 'company_id',
        as: 'suppliers'
      });

      // Company has many categories
      Company.hasMany(models.Category, {
        foreignKey: 'company_id',
        as: 'categories'
      });

      // Company has many products
      Company.hasMany(models.Product, {
        foreignKey: 'company_id',
        as: 'products'
      });

      // Company has many settings
      Company.hasMany(models.Setting, {
        foreignKey: 'company_id',
        as: 'settings'
      });

      // Company has many POS sales
      if (models.PosSale) {
        Company.hasMany(models.PosSale, {
          foreignKey: 'company_id',
          as: 'posSales'
        });
      }
    }
  }

  Company.init({
    company_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(VALIDATION.COMPANY_NAME_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: [VALIDATION.COMPANY_NAME_MIN_LENGTH, VALIDATION.COMPANY_NAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(VALIDATION.COMPANY_EMAIL_MAX_LENGTH),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(VALIDATION.COMPANY_PHONE_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: [0, VALIDATION.COMPANY_PHONE_MAX_LENGTH]
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, VALIDATION.COMPANY_ADDRESS_MAX_LENGTH]
      }
    },
    logo_url: {
      type: DataTypes.STRING(VALIDATION.COMPANY_LOGO_URL_MAX_LENGTH),
      allowNull: true,
      validate: {
        isUrlOrEmpty(value) {
          if (value && value.trim() !== '') {
            // Only validate as URL if value is not empty
            const urlPattern = /^(https?:\/\/|\/)/;
            if (!urlPattern.test(value)) {
              throw new Error('Logo URL must be a valid URL or path');
            }
          }
        }
      }
    },
    currency: {
      type: DataTypes.STRING(VALIDATION.COMPANY_CURRENCY_MAX_LENGTH),
      allowNull: true,
      defaultValue: DEFAULTS.CURRENCY,
      validate: {
        len: [3, VALIDATION.COMPANY_CURRENCY_MAX_LENGTH]
      }
    },
    date_format: {
      type: DataTypes.STRING(VALIDATION.COMPANY_DATE_FORMAT_MAX_LENGTH),
      allowNull: true,
      defaultValue: DEFAULTS.DATE_FORMAT,
      validate: {
        len: [0, VALIDATION.COMPANY_DATE_FORMAT_MAX_LENGTH]
      }
    },
    timezone: {
      type: DataTypes.STRING(VALIDATION.COMPANY_TIMEZONE_MAX_LENGTH),
      allowNull: true,
      defaultValue: DEFAULTS.TIMEZONE,
      validate: {
        len: [0, VALIDATION.COMPANY_TIMEZONE_MAX_LENGTH]
      }
    }
  }, {
    sequelize,
    modelName: 'Company',
    tableName: 'companies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['email']
      }
    ],
    hooks: {
      beforeCreate: async (company) => {
        // Convert name to title case for consistency
        if (company.name) {
          company.name = company.name.trim();
        }
        
        // Convert email to lowercase
        if (company.email) {
          company.email = company.email.toLowerCase();
        }
      },
      beforeUpdate: async (company) => {
        // Convert name to title case for consistency
        if (company.changed('name') && company.name) {
          company.name = company.name.trim();
        }
        
        // Convert email to lowercase
        if (company.changed('email') && company.email) {
          company.email = company.email.toLowerCase();
        }
      }
    }
  });

  return Company;
};
