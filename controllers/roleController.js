'use strict';

const RoleService = require('../services/roleService');

// Create a singleton instance of RoleService
const roleService = new RoleService();

/**
 * Role Controller
 * Handles HTTP requests for role management operations
 */
class RoleController {
  /**
   * Get all roles
   * GET /api/roles
   */
  static async getAllRoles(req, res) {
    try {
      const result = await roleService.list(req.query);

      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all roles error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving roles'
      });
    }
  }

  /**
   * Get role by ID
   * GET /api/roles/:id
   */
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await roleService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Role retrieved successfully',
        data: role
      });
    } catch (error) {
      console.error('Get role by ID error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving role'
      });
    }
  }

  /**
   * Create a new role
   * POST /api/roles
   */
  static async createRole(req, res) {
    try {
      const { name, description } = req.body;

      const role = await roleService.createRole({
        name,
        description
      });

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      });
    } catch (error) {
      console.error('Create role error:', error);
      
      if (error.message.includes('required') || 
          error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating role'
      });
    }
  }

  /**
   * Update role
   * PUT /api/roles/:id
   */
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const role = await roleService.updateRole(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: role
      });
    } catch (error) {
      console.error('Update role error:', error);
      
      if (error.message.includes('not found') || 
          error.message.includes('already exists') ||
          error.message.includes('No valid fields')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating role'
      });
    }
  }

  /**
   * Delete role
   * DELETE /api/roles/:id
   */
  static async deleteRole(req, res) {
    try {
      const { id } = req.params;

      await roleService.deleteRole(id);

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Delete role error:', error);
      
      if (error.message.includes('not found') || 
          error.message.includes('assigned to users')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting role'
      });
    }
  }

  /**
   * Get users with specific role
   * GET /api/roles/:id/users
   */
  static async getUsersWithRole(req, res) {
    try {
      const { id } = req.params;
      const users = await roleService.getUsersWithRole(id);

      res.status(200).json({
        success: true,
        message: 'Users with role retrieved successfully',
        data: users
      });
    } catch (error) {
      console.error('Get users with role error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving users with role'
      });
    }
  }

  /**
   * Assign role to user
   * POST /api/roles/:roleId/users/:userId
   */
  static async assignRoleToUser(req, res) {
    try {
      const { roleId, userId } = req.params;

      await roleService.assignRoleToUser(userId, roleId);

      res.status(200).json({
        success: true,
        message: 'Role assigned to user successfully'
      });
    } catch (error) {
      console.error('Assign role to user error:', error);
      
      if (error.message.includes('not found') || 
          error.message.includes('already has this role')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while assigning role to user'
      });
    }
  }

  /**
   * Remove role from user
   * DELETE /api/roles/:roleId/users/:userId
   */
  static async removeRoleFromUser(req, res) {
    try {
      const { roleId, userId } = req.params;

      await roleService.removeRoleFromUser(userId, roleId);

      res.status(200).json({
        success: true,
        message: 'Role removed from user successfully'
      });
    } catch (error) {
      console.error('Remove role from user error:', error);
      
      if (error.message.includes('not found') || 
          error.message.includes('does not have this role')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while removing role from user'
      });
    }
  }

  /**
   * Get user roles
   * GET /api/users/:userId/roles
   */
  static async getUserRoles(req, res) {
    try {
      const { userId } = req.params;
      const roles = await roleService.getUserRoles(userId);

      res.status(200).json({
        success: true,
        message: 'User roles retrieved successfully',
        data: roles
      });
    } catch (error) {
      console.error('Get user roles error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving user roles'
      });
    }
  }
}

module.exports = RoleController;

