'use strict';

const express = require('express');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');
const authorize = require('../middleware/permissionMiddleware');

const router = express.Router();

/**
 * User Management Routes
 * All routes are prefixed with /api/users
 */

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users - Get all users with pagination
router.get(
  '/',
  authorize('users', 'read'),
  ActivityTrack.middleware({ action: 'view', entityType: 'user' }),
  UserController.getUsers
);

// GET /api/users/:id - Get user by ID
router.get(
  '/:id',
  authorize('users', 'read'),
  UserController.getUserById
);

// POST /api/users - Create new user
router.post(
  '/',
  authorize('users', 'create'),
  UserController.createUser
);

// PUT /api/users/:id - Update user
router.put(
  '/:id',
  authorize('users', 'update'),
  UserController.updateUser
);

// DELETE /api/users/:id - Delete user
router.delete(
  '/:id',
  authorize('users', 'delete'),
  UserController.deleteUser
);

module.exports = router;
