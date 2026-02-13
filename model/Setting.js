'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
  
    static associate(models) {
      // Setting belongs to a company
      Setting.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });
    }
  }

  Setting.init({
    setting_id: {
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
    setting_key: {
      type: DataTypes.STRING(VALIDATION.SETTING_KEY_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: [1, VALIDATION.SETTING_KEY_MAX_LENGTH],
        notEmpty: true
      }
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, VALIDATION.SETTING_VALUE_MAX_LENGTH]
      }
    }
  }, {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['setting_key']
      },
      {
        fields: ['company_id', 'setting_key'],
        unique: true
      }
    ]
  });

  return Setting;
};
