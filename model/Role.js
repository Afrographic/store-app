'use strict';
const { Model } = require('sequelize');
const { VALIDATION } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
  
    static associate(models) {
      // Role can be assigned to many users through user_roles table
      Role.belongsToMany(models.User, {
        through: models.UserRole,
        foreignKey: 'role_id',
        otherKey: 'user_id',
        as: 'users'
      });

      // Role has many user role assignments
      Role.hasMany(models.UserRole, {
        foreignKey: 'role_id',
        as: 'userRoles'
      });
    }
  }

  Role.init({
    role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(VALIDATION.ROLE_NAME_MAX_LENGTH),
      allowNull: false,
      unique: true,
      validate: {
        len: [VALIDATION.ROLE_NAME_MIN_LENGTH, VALIDATION.ROLE_NAME_MAX_LENGTH],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING(VALIDATION.ROLE_DESCRIPTION_MAX_LENGTH),
      allowNull: true,
      validate: {
        len: [0, VALIDATION.ROLE_DESCRIPTION_MAX_LENGTH]
      }
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['name'],
        unique: true
      }
    ]
  });

  return Role;
};

