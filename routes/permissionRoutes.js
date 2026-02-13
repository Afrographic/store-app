'use strict';

const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Permission Routes
 * All routes are prefixed with /api/permissions
 */

// Apply authentication to all permission routes
router.use(authMiddleware);

/**
 * @route GET /api/permissions
 * @desc Get all permissions configuration
 * @access Private
 */
router.get('/', permissionController.getPermissions);

module.exports = router;

