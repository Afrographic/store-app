'use strict';

const { User } = require('../model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPermissionsForRoles } = require('../utils/permissions');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Authentication Service
 * Contains all business logic for user authentication and authorization
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration result
   */
  static async registerUser(userData) {
    const { username, email, full_name, password } = userData;

    // Basic validation
    if (!username || !email || !full_name || !password) {
      throw new Error('All fields are required: username, email, full_name, password');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Password validation
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    // Check if user already exists by username
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      throw new Error('Username already exists');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      username,
      email,
      full_name,
      password_hash,
    });

    // Return user data without password
    return this.formatUserResponse(user);
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login result with token and user data
   */
  static async loginUser(email, password) {
    // Basic validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email with roles
    const user = await User.findOne({
      where: { email },
      include: [{
        model: require('../model').Role,
        as: 'roles',
        through: { attributes: [] } // Exclude junction table attributes
      }]
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login (if field exists)
    try {
      await user.update({ last_login: new Date() });
    } catch (error) {
      // Ignore if last_login field doesn't exist
    }

    const roleNames = (user.roles || []).map(role => role.name);

    // Generate JWT token
    const token = this.generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      company_id: user.company_id,
      roles: roleNames
    });

    // Prepare user response
    const userResponse = this.formatUserResponse(user);

    return {
      user: userResponse,
      token,
      expires_in: JWT_EXPIRES_IN
    };
  }

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - User profile data
   */
  static async getUserProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user data
   */
  static async updateUserProfile(userId, updateData) {
    const allowedFields = ['full_name', 'email'];
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

    // Check if email is being updated and if it already exists
    if (fieldsToUpdate.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email: fieldsToUpdate.email,
          user_id: { [require('sequelize').Op.ne]: userId }
        } 
      });
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update(fieldsToUpdate);

    // Get updated user
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    return updatedUser;
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  static async changeUserPassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const new_password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({ password_hash: new_password_hash });

    return true;
  }

  /**
   * Generate new JWT token
   * @param {Object} payload - Token payload
   * @returns {string} - JWT token
   */
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Refresh JWT token
   * @param {Object} userData - User data from existing token
   * @returns {Object} - New token data
   */
  static refreshUserToken(userData) {
    const { user_id, username, email, company_id, roles } = userData;

    const token = this.generateToken({
      user_id,
      username,
      email,
      company_id,
      roles
    });

    return {
      token,
      expires_in: JWT_EXPIRES_IN
    };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  static verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  /**
   * Format user response (remove sensitive data)
   * @param {Object} user - User object
   * @returns {Object} - Formatted user response
   */
  static formatUserResponse(user) {
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const roleNames = userRoles.map(role => role.name);
    const permissions = getPermissionsForRoles(roleNames);

    return {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      company_id: user.company_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: userRoles.map(role => ({
        role_id: role.role_id,
        name: role.name,
        description: role.description
      })),
      permissions
    };
  }
}

module.exports = AuthService;
