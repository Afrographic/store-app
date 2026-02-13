'use strict';

const User = require('../model').User;
const Role = require('../model').Role;
const activityTrack = require('../utils/activityTrack');

/**
 * User Controller
 * Handles HTTP requests for user management operations
 */
class UserController {
  /**
   * Get all users with pagination
   * GET /api/users
   */
  static async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'user_id',
        order = 'desc'
      } = req.query;

      // Calculate offset for pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build order clause
      const orderClause = [[sort, order.toUpperCase()]];

      // Count users separately to avoid inflation from Role joins
      const totalCount = await User.count({
        distinct: true,
        col: 'user_id'
      });

      // Get users with pagination and include role information
      const users = await User.findAll({
        order: orderClause,
        limit: parseInt(limit),
        offset: offset,
        attributes: { exclude: ['password_hash'] }, // Exclude password
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['role_id', 'name', 'description'],
            through: { attributes: [] } // Exclude the join table attributes
          }
        ]
      });

      const count = totalCount;

      // Calculate pagination info
      const totalPages = Math.ceil(count / parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: totalPages
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving users'
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['role_id', 'name', 'description'],
            through: { attributes: [] } // Exclude the join table attributes
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('user', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving user'
      });
    }
  }

  /**
   * Create new user
   * POST /api/users
   */
  static async createUser(req, res) {
    try {
      const { username, email, full_name, password, role } = req.body;

      console.log('Create user request:', { username, email, full_name, role });

      // Basic validation
      if (!username || !email || !full_name || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: username, email, full_name, password'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Password validation
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Check if user already exists by email
      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Check if user already exists by username
      const existingUserByUsername = await User.findOne({ where: { username } });
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Create user - password will be automatically hashed by User model's beforeCreate hook
      const user = await User.create({
        username,
        email,
        full_name,
        password_hash: password // Model hook will hash this automatically
      });

      // Handle role assignment if role is provided
      if (role) {
        console.log('Assigning role to new user:', role);
        
        // Find the role by name
        const roleToAssign = await Role.findOne({ 
          where: { name: role.toLowerCase() } 
        });
        
        if (roleToAssign) {
          // Assign the role to the new user
          await user.addRole(roleToAssign);
        } else {
          console.log(`Role '${role}' not found, user created without role`);
        }
      }

      // Fetch user with roles
      const userWithRoles = await User.findByPk(user.user_id, {
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }]
      });

      // Return user data without password
      const userResponse = {
        user_id: userWithRoles.user_id,
        username: userWithRoles.username,
        email: userWithRoles.email,
        full_name: userWithRoles.full_name,
        roles: userWithRoles.roles,
        role: userWithRoles.roles && userWithRoles.roles.length > 0 ? userWithRoles.roles[0].name : null,
        created_at: userWithRoles.created_at,
        updated_at: userWithRoles.updated_at
      };

      // Log create activity
      try {
        await activityTrack.created('user', userWithRoles.user_id, {
          userId: req.user?.user_id,
          description: { username, email, full_name, role }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userResponse
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating user'
      });
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, full_name, role } = req.body;

      console.log('Update user request:', { id, username, email, full_name, role });

      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }]
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is being updated and if it already exists
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ 
          where: { 
            email: email,
            user_id: { [Op.ne]: id }
          } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Check if username is being updated and if it already exists
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ 
          where: { 
            username: username,
            user_id: { [Op.ne]: id }
          } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Username already exists'
          });
        }
      }

      // Update user basic info
      await user.update({
        username: username || user.username,
        email: email || user.email,
        full_name: full_name || user.full_name
      });

      // Handle role assignment if role is provided
      if (role !== undefined) {
        console.log('Assigning role:', role);
        
        if (role) {
          // Find the role by name
          const roleToAssign = await Role.findOne({ 
            where: { name: role.toLowerCase() } 
          });
          
          if (!roleToAssign) {
            return res.status(400).json({
              success: false,
              message: `Role '${role}' not found`
            });
          }

          // Remove all existing roles for this user
          await user.setRoles([]);
          
          // Assign the new role
          await user.addRole(roleToAssign);
          
          console.log('Role assigned successfully');
        } else {
          // If role is empty string, remove all roles
          await user.setRoles([]);
        }
      }

      // Fetch updated user with roles
      const updatedUser = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }]
      });

      // Return updated user data without password
      const userResponse = {
        user_id: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        roles: updatedUser.roles,
        role: updatedUser.roles && updatedUser.roles.length > 0 ? updatedUser.roles[0].name : null,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      };

      // Log update activity
      try {
        await activityTrack.updated('user', id, {
          userId: req.user?.user_id,
          description: { username, email, full_name, role }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: userResponse
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating user'
      });
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.destroy();

      // Log delete activity
      try {
        await activityTrack.deleted('user', id, { userId: req.user?.user_id, description: { username: user.username, email: user.email } });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting user'
      });
    }
  }
}

module.exports = UserController;
