'use strict';

const express = require('express');
const PosSaleController = require('../controllers/posSaleController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POS Sale Routes
 * All routes are prefixed with /api/pos-sales
 */

// Apply authentication to all POS sale routes
router.use(authMiddleware);

// GET /api/pos-sales - Get all POS sales with pagination and search
router.get(
  '/',
  PosSaleController.getAllPosSales
);

// GET /api/pos-sales/:id - Get POS sale by ID
router.get(
  '/:id',
  PosSaleController.getPosSaleById
);

// POST /api/pos-sales - Create new POS sale
router.post(
  '/',
  PosSaleController.createPosSale
);

// PUT /api/pos-sales/:id - Update POS sale
router.put(
  '/:id',
  PosSaleController.updatePosSale
);

// DELETE /api/pos-sales/:id - Delete POS sale
router.delete(
  '/:id',
  PosSaleController.deletePosSale
);

// POST /api/pos-sales/:id/cancel - Cancel POS sale
router.post(
  '/:id/cancel',
  PosSaleController.cancelPosSale
);

module.exports = router;

