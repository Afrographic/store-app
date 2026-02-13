'use strict';

const express = require('express');
const RoleController = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Role Management Routes
 * All routes are prefixed with /api/roles
 */

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Role CRUD operations
router.get('/', RoleController.getAllRoles);
router.get('/:id', RoleController.getRoleById);
router.post('/', RoleController.createRole);
router.put('/:id', RoleController.updateRole);
router.delete('/:id', RoleController.deleteRole);

// Role-User relationship operations
router.get('/:id/users', RoleController.getUsersWithRole);
router.post('/:roleId/users/:userId', RoleController.assignRoleToUser);
router.delete('/:roleId/users/:userId', RoleController.removeRoleFromUser);

// User roles operations
router.get('/users/:userId/roles', RoleController.getUserRoles);

module.exports = router;

