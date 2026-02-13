'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserRole extends Model {
  
    static associate(models) {
      // UserRole belongs to a user
      UserRole.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // UserRole belongs to a role
      UserRole.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
      });

      // UserRole belongs to a location (optional)
      UserRole.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location'
      });
    }
  }

  UserRole.init({
    user_role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'role_id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'location_id'
      }
    }
  }, {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['role_id']
      },
      {
        fields: ['location_id']
      }
    ]
  });

  return UserRole;
};

