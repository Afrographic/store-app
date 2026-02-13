'use strict';

const AuthService = require('../services/authService');

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const { username, email, full_name, password } = req.body;

      // Call auth service to register user
      const user = await AuthService.registerUser({
        username,
        email,
        full_name,
        password
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle validation errors
      if (error.message.includes('required') || 
          error.message.includes('Invalid') || 
          error.message.includes('already exists') ||
          error.message.includes('must be at least')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Handle other errors
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Call auth service to login user
      const result = await AuthService.loginUser(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle authentication errors
      if (error.message.includes('Invalid email or password') || 
          error.message.includes('required')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      // Handle other errors
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.user_id;

      // Call auth service to get user profile
      const user = await AuthService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving profile'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.user_id;
      const updateData = req.body;

      // Call auth service to update user profile
      const user = await AuthService.updateUserProfile(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      
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
        message: 'Internal server error while updating profile'
      });
    }
  }

  /**
   * Change user password
   * PUT /api/auth/change-password
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user.user_id;
      const { current_password, new_password } = req.body;

      // Call auth service to change password
      await AuthService.changeUserPassword(userId, current_password, new_password);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.message.includes('required') || 
          error.message.includes('incorrect') ||
          error.message.includes('must be at least') ||
          error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while changing password'
      });
    }
  }

  /**
   * Refresh JWT token
   * POST /api/auth/refresh
   */
  static async refreshToken(req, res) {
    try {
      const userData = req.user;

      // Call auth service to refresh token
      const result = AuthService.refreshUserToken(userData);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error while refreshing token'
      });
    }
  }
}

module.exports = AuthController;