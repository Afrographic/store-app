'use strict';
const { Model } = require('sequelize');
const { VALIDATION, ENUMS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class PaymentMethod extends Model {
  
    static associate(models) {
      // PaymentMethod belongs to a company
      PaymentMethod.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      // PaymentMethod has many POS sales
      if (models.PosSale) {
        PaymentMethod.hasMany(models.PosSale, {
          foreignKey: 'payment_method_id',
          as: 'posSales'
        });
      }
    }
  }

  PaymentMethod.init({
    payment_method_id: {
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
      type: DataTypes.STRING(VALIDATION.PAYMENT_METHOD_NAME_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: [VALIDATION.PAYMENT_METHOD_NAME_MIN_LENGTH, VALIDATION.PAYMENT_METHOD_NAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.ENUM(...ENUMS.PAYMENT_METHOD_TYPE),
      allowNull: false,
      validate: {
        isIn: [ENUMS.PAYMENT_METHOD_TYPE]
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return PaymentMethod;
};

