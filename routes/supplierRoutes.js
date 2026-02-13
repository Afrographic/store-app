'use strict';

const express = require('express');
const SupplierController = require('../controllers/supplierController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Supplier Routes
 * All routes are prefixed with /api/suppliers
 */

// Apply authentication to all supplier routes
router.use(authMiddleware);

// GET /api/suppliers/dropdown/all - Get all suppliers for dropdown (MUST BE BEFORE /:id route)
router.get(
  '/dropdown/all',
  permissionMiddleware('suppliers', 'read'),
  SupplierController.getSuppliersForDropdown
);

// GET /api/suppliers - Get all suppliers with pagination and search
router.get(
  '/',
  permissionMiddleware('suppliers', 'read'),
  SupplierController.getAllSuppliers
);

// GET /api/suppliers/:id - Get supplier by ID
router.get(
  '/:id',
  permissionMiddleware('suppliers', 'read'),
  SupplierController.getSupplierById
);

// POST /api/suppliers - Create new supplier
router.post(
  '/',
  permissionMiddleware('suppliers', 'create'),
  SupplierController.createSupplier
);

// PUT /api/suppliers/:id - Update supplier
router.put(
  '/:id',
  permissionMiddleware('suppliers', 'update'),
  SupplierController.updateSupplier
);

// DELETE /api/suppliers/:id - Delete supplier
router.delete(
  '/:id',
  permissionMiddleware('suppliers', 'delete'),
  SupplierController.deleteSupplier
);

module.exports = router;

