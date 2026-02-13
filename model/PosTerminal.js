'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class PosTerminal extends Model {
  
    static associate(models) {
      // PosTerminal belongs to a location
      PosTerminal.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location'
      });

      // PosTerminal has many POS sales
      if (models.PosSale) {
        PosTerminal.hasMany(models.PosSale, {
          foreignKey: 'terminal_id',
          as: 'posSales'
        });
      }
    }
  }

  PosTerminal.init({
    terminal_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'location_id'
      },
      validate: {
        notNull: true
      }
    },
    terminal_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true
      }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'INACTIVE']]
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'PosTerminal',
    tableName: 'pos_terminals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['location_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  return PosTerminal;
};
