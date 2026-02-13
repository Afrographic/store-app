'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
  
    static associate(models) {
      // Location belongs to a company
      Location.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      // Location has many inventory records
      Location.hasMany(models.Inventory, {
        foreignKey: 'location_id',
        as: 'inventory'
      });

      // Location has many stock movements
      Location.hasMany(models.StockMovement, {
        foreignKey: 'location_id',
        as: 'stockMovements'
      });

      // Location can be assigned to many users through user_roles
      Location.hasMany(models.UserRole, {
        foreignKey: 'location_id',
        as: 'userRoles'
      });

      // Location has many POS terminals
      if (models.PosTerminal) {
        Location.hasMany(models.PosTerminal, {
          foreignKey: 'location_id',
          as: 'posTerminals'
        });
      }

      // Location has many POS sales
      if (models.PosSale) {
        Location.hasMany(models.PosSale, {
          foreignKey: 'location_id',
          as: 'posSales'
        });
      }
    }
  }

  Location.init({
    location_id: {
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
      type: DataTypes.STRING(VALIDATION.LOCATION_NAME_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: [VALIDATION.LOCATION_NAME_MIN_LENGTH, VALIDATION.LOCATION_NAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, VALIDATION.LOCATION_ADDRESS_MAX_LENGTH]
      }
    },
    phone: {
      type: DataTypes.STRING(VALIDATION.LOCATION_PHONE_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: [0, VALIDATION.LOCATION_PHONE_MAX_LENGTH]
      }
    }
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
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

  return Location;
};
