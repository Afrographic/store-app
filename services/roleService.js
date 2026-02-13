'use strict';

const { Role, User } = require('../model');
const { createRoleCrudService } = require('./crudServiceFactory');

/**
 * Role Service
 * Contains all business logic for role management
 * Uses CRUD service for basic operations and adds role-specific logic
 */
class RoleService {
  constructor() {
    this.crudService = createRoleCrudService();
  }

  /**
   * Create a new role with validation
   * @param {Object} roleData - Role data
   * @param {Object} additionalOptions - Additional Sequelize options
   * @returns {Promise<Object>} - Created role
   */
  async createRole(roleData, additionalOptions = {}) {
    const { name, description } = roleData;

    // Basic validation
    if (!name) {
      throw new Error('Role name is required');
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    // Use CRUD service to create role
    return this.crudService.create(roleData, additionalOptions);
  }

  /**
   * Update role with validation
   * @param {number} roleId - Role ID
   * @param {Object} updateData - Data to update
   * @param {Object} additionalOptions - Additional Sequelize options
   * @returns {Promise<Object>} - Updated role
   */
  async updateRole(roleId, updateData, additionalOptions = {}) {
    const allowedFields = ['name', 'description'];
    const fieldsToUpdate = {};

    // Only allow specific fields to be updated
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        fieldsToUpdate[key] = updateData[key];
      }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Check if name is being updated and if it already exists
    if (fieldsToUpdate.name) {
      const existingRole = await Role.findOne({ 
        where: { 
          name: fieldsToUpdate.name,
          role_id: { [require('sequelize').Op.ne]: roleId }
        } 
      });
      if (existingRole) {
        throw new Error('Role name already exists');
      }
    }

    // Use CRUD service to update role
    return this.crudService.update(roleId, fieldsToUpdate, additionalOptions);
  }

  /**
   * Delete role with validation
   * @param {number} roleId - Role ID
   * @param {Object} additionalOptions - Additional Sequelize options
   * @returns {Promise<boolean>} - Success status
   */
  async deleteRole(roleId, additionalOptions = {}) {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if role is assigned to any users
    const usersWithRole = await role.getUsers();
    if (usersWithRole.length > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    // Use CRUD service to delete role
    return this.crudService.delete(roleId, additionalOptions);
  }

  /**
   * Delegate other CRUD operations to the base service
   */
  async list(queryParams, additionalOptions) {
    return this.crudService.list(queryParams, additionalOptions);
  }

  async getById(id, additionalOptions) {
    return this.crudService.getById(id, additionalOptions);
  }

  async exists(id) {
    return this.crudService.exists(id);
  }

  async count(filters) {
    return this.crudService.count(filters);
  }

  async dropdown(options) {
    return this.crudService.dropdown(options);
  }

  /**
   * Get users with specific role
   * @param {number} roleId - Role ID
   * @returns {Promise<Array>} - Users with the role
   */
  async getUsersWithRole(roleId) {
    const role = await Role.findByPk(roleId, {
      include: [{
        model: User,
        as: 'users',
        attributes: { exclude: ['password_hash'] }
      }]
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.users;
  }

  /**
   * Assign role to user
   * @param {number} userId - User ID
   * @param {number} roleId - Role ID
   * @returns {Promise<boolean>} - Success status
   */
  async assignRoleToUser(userId, roleId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if user already has this role
    const hasRole = await user.hasRole(role);
    if (hasRole) {
      throw new Error('User already has this role');
    }

    await user.addRole(role);
    return true;
  }

  /**
   * Remove role from user
   * @param {number} userId - User ID
   * @param {number} roleId - Role ID
   * @returns {Promise<boolean>} - Success status
   */
  async removeRoleFromUser(userId, roleId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if user has this role
    const hasRole = await user.hasRole(role);
    if (!hasRole) {
      throw new Error('User does not have this role');
    }

    await user.removeRole(role);
    return true;
  }

  /**
   * Get user roles
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - User roles
   */
  async getUserRoles(userId) {
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles'
      }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.roles;
  }
}

module.exports = RoleService;

