'use strict';
const { Model } = require('sequelize');
const { VALIDATION, ENUMS } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class PosSale extends Model {
  
    static associate(models) {
      // PosSale belongs to a company
      PosSale.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      // PosSale belongs to a location
      PosSale.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location'
      });

      // PosSale belongs to a POS terminal
      PosSale.belongsTo(models.PosTerminal, {
        foreignKey: 'terminal_id',
        as: 'terminal'
      });

      // PosSale belongs to a client
      PosSale.belongsTo(models.Client, {
        foreignKey: 'client_id',
        as: 'client'
      });

      // PosSale belongs to a user (cashier)
      PosSale.belongsTo(models.User, {
        foreignKey: 'cashier_id',
        as: 'cashier'
      });

      // PosSale belongs to a payment method
      PosSale.belongsTo(models.PaymentMethod, {
        foreignKey: 'payment_method_id',
        as: 'paymentMethod'
      });

      // PosSale has many sale items
      PosSale.hasMany(models.PosSaleItem, {
        foreignKey: 'sale_id',
        as: 'saleItems'
      });
    }
  }

  PosSale.init({
    sale_id: {
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
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'location_id'
      }
    },
    terminal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pos_terminals',
        key: 'terminal_id'
      }
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'client_id'
      }
    },
    cashier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    sale_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    subtotal: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
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
    total_amount: {
      type: DataTypes.DECIMAL(VALIDATION.DECIMAL_PRECISION, VALIDATION.DECIMAL_SCALE),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'payment_methods',
        key: 'payment_method_id'
      }
    },
    payment_status: {
      type: DataTypes.ENUM(...ENUMS.POS_PAYMENT_STATUS),
      allowNull: false,
      defaultValue: 'PAID',
      validate: {
        isIn: [ENUMS.POS_PAYMENT_STATUS]
      }
    },
    status: {
      type: DataTypes.ENUM(...ENUMS.POS_SALE_STATUS),
      allowNull: false,
      defaultValue: 'COMPLETED',
      validate: {
        isIn: [ENUMS.POS_SALE_STATUS]
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PosSale',
    tableName: 'pos_sales',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['location_id']
      },
      {
        fields: ['terminal_id']
      },
      {
        fields: ['client_id']
      },
      {
        fields: ['cashier_id']
      },
      {
        fields: ['payment_method_id']
      },
      {
        fields: ['sale_date']
      },
      {
        fields: ['payment_status']
      },
      {
        fields: ['status']
      },
      {
        fields: ['invoice_number'],
        unique: true
      }
    ]
  });

  return PosSale;
};

