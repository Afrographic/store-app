'use strict';

const express = require('express');
const PosTerminalController = require('../controllers/posTerminalController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');

const router = express.Router();

/**
 * POS Terminal Routes
 * All routes are prefixed with /api/pos-terminals
 */

// Apply authentication to all POS terminal routes
router.use(authMiddleware);

// GET /api/pos-terminals/dropdown/all - Get all POS terminals for dropdown (MUST BE BEFORE /:id route)
router.get(
  '/dropdown/all',
  PosTerminalController.getPosTerminalsForDropdown
);

// GET /api/pos-terminals - Get all POS terminals with pagination and search
router.get(
  '/',
  PosTerminalController.getAllPosTerminals
);

// GET /api/pos-terminals/:id - Get POS terminal by ID
router.get(
  '/:id',
  PosTerminalController.getPosTerminalById
);

// POST /api/pos-terminals - Create new POS terminal
router.post(
  '/',
  permissionMiddleware('posTerminals', 'create'),
  PosTerminalController.createPosTerminal
);

// PUT /api/pos-terminals/:id - Update POS terminal
router.put(
  '/:id',
  permissionMiddleware('posTerminals', 'update'),
  PosTerminalController.updatePosTerminal
);

// DELETE /api/pos-terminals/:id - Delete POS terminal
router.delete(
  '/:id',
  permissionMiddleware('posTerminals', 'delete'),
  PosTerminalController.deletePosTerminal
);

module.exports = router;

