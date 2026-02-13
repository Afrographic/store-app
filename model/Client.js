'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
  
    static associate(models) {
      // Client belongs to a company
      Client.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      // Client has many POS sales
      if (models.PosSale) {
        Client.hasMany(models.PosSale, {
          foreignKey: 'client_id',
          as: 'posSales'
        });
      }
    }
  }

  Client.init({
    client_id: {
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
      type: DataTypes.STRING(VALIDATION.CLIENT_NAME_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: [VALIDATION.CLIENT_NAME_MIN_LENGTH, VALIDATION.CLIENT_NAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    contact_name: {
      type: DataTypes.STRING(VALIDATION.CLIENT_CONTACT_NAME_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: [0, VALIDATION.CLIENT_CONTACT_NAME_MAX_LENGTH]
      }
    },
    email: {
      type: DataTypes.STRING(VALIDATION.CLIENT_EMAIL_MAX_LENGTH),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(VALIDATION.CLIENT_PHONE_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: [0, VALIDATION.CLIENT_PHONE_MAX_LENGTH]
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, VALIDATION.CLIENT_ADDRESS_MAX_LENGTH]
      }
    }
  }, {
    sequelize,
    modelName: 'Client',
    tableName: 'clients',
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

  return Client;
};

