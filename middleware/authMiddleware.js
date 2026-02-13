'use strict';

const AuthService = require('../services/authService');

/**
 * Authentication Middleware
 * Verifies JWT token and adds user data to request object
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);
    const normalizedRoles = Array.isArray(decoded.roles)
      ? decoded.roles.map(role => typeof role === 'string' ? role.toLowerCase() : role)
      : [];
    
    // Add user data to request object
    req.user = {
      ...decoded,
      roles: normalizedRoles
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

module.exports = authMiddleware;
