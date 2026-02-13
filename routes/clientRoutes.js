'use strict';

const express = require('express');
const ClientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');
const authorize = require('../middleware/permissionMiddleware');

const router = express.Router();

/**
 * Client Routes
 * All routes are prefixed with /api/clients
 */

// Apply authentication to all client routes
router.use(authMiddleware);

// GET /api/clients/dropdown/all - Get all clients for dropdown (MUST BE BEFORE /:id route)
router.get(
  '/dropdown/all',
  authorize('clients', 'read'),
  ClientController.getClientsForDropdown
);

// GET /api/clients - Get all clients with pagination and search
router.get(
  '/',
  authorize('clients', 'read'),
  ClientController.getAllClients
);

// GET /api/clients/:id - Get client by ID
router.get(
  '/:id',
  authorize('clients', 'read'),
  ClientController.getClientById
);

// POST /api/clients - Create new client
router.post(
  '/',
  authorize('clients', 'create'),
  ClientController.createClient
);

// PUT /api/clients/:id - Update client
router.put(
  '/:id',
  authorize('clients', 'update'),
  ClientController.updateClient
);

// DELETE /api/clients/:id - Delete client
router.delete(
  '/:id',
  authorize('clients', 'delete'),
  ClientController.deleteClient
);

module.exports = router;

