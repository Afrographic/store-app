'use strict';
const { Model } = require('sequelize');
const { VALIDATION, BCRYPT } = require('../utils/constants');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
  
    static associate(models) {
      // Define associations here

      // User belongs to a company
      User.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });

      // User can have multiple roles through user_roles table
      User.belongsToMany(models.Role, {
        through: models.UserRole,
        foreignKey: 'user_id',
        otherKey: 'role_id',
        as: 'roles'
      });

      // User can have multiple user role assignments
      User.hasMany(models.UserRole, {
        foreignKey: 'user_id',
        as: 'userRoles'
      });

      // User can have multiple logs
      User.hasMany(models.Log, {
        foreignKey: 'user_id',
        as: 'logs'
      });

      // User can create multiple stock movements
      User.hasMany(models.StockMovement, {
        foreignKey: 'created_by',
        as: 'stockMovements'
      });

      // User can be a cashier for multiple POS sales
      if (models.PosSale) {
        User.hasMany(models.PosSale, {
          foreignKey: 'cashier_id',
          as: 'posSalesAsCashier'
        });
      }
    }

    // Instance methods
    toJSON() {
      const values = Object.assign({}, this.get());
      // Remove sensitive data
      delete values.password_hash;
      return values;
    }

    // Method to verify password
    async verifyPassword(password) {
      return bcrypt.compare(password, this.password_hash);
    }
  }

  User.init({
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(VALIDATION.USERNAME_MAX_LENGTH),
      allowNull: false,
      unique: true,
      validate: {
        len: [VALIDATION.USERNAME_MIN_LENGTH, VALIDATION.USERNAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(VALIDATION.PASSWORD_MAX_LENGTH),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(VALIDATION.EMAIL_MAX_LENGTH),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    full_name: {
      type: DataTypes.STRING(VALIDATION.FULL_NAME_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: [VALIDATION.FULL_NAME_MIN_LENGTH, VALIDATION.FULL_NAME_MAX_LENGTH]
      }
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'company_id'
      },
      validate: {
        isInt: {
          msg: 'Company ID must be an integer'
        },
        min: {
          args: [1],
          msg: 'Company ID must be greater than 0'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['username'],
        unique: true
      },
      {
        fields: ['email']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        // Hash password before creating user
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, BCRYPT.SALT_ROUNDS);
        }
      },
      beforeUpdate: async (user) => {
        // Hash password before updating if it's changed
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, BCRYPT.SALT_ROUNDS);
        }
      }
    }
  });

  return User;
};
