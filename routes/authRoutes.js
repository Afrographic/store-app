'use strict';

const express = require('express');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Authentication Routes
 * All routes are prefixed with /api/auth
 */

// Public routes (no authentication required)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes (authentication required)
router.get(
  '/profile',
  authMiddleware,
  AuthController.getProfile
);
router.put(
  '/profile',
  authMiddleware,
  AuthController.updateProfile
);
router.put(
  '/change-password',
  authMiddleware,
  AuthController.changePassword
);
router.post(
  '/refresh',
  authMiddleware,
  AuthController.refreshToken
);

module.exports = router;
