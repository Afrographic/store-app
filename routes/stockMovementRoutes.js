'use strict';

const express = require('express');
const StockMovementController = require('../controllers/stockMovementController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Stock Movement Routes
 * All routes are prefixed with /api/stockMovements
 */

// Apply authentication to all stock movement routes
router.use(authMiddleware);

// GET /api/stockMovements/inventory/:product_id/:location_id - Get inventory quantity (MUST BE BEFORE general GET)
router.get(
  '/inventory/:product_id/:location_id',
  StockMovementController.getInventoryQuantity
);

// GET /api/stockMovements - Get all stock movements with pagination and filters
router.get(
  '/',
  StockMovementController.getAllStockMovements
);

// POST /api/stockMovements - Create new stock movement
router.post(
  '/',
  StockMovementController.createStockMovement
);

module.exports = router;

