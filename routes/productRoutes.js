'use strict';

const express = require('express');
const ProductController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const productImageUpload = require('../middleware/productImageUpload');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Product Routes
 * All routes are prefixed with /api/products
 */

// Apply authentication to all product routes
router.use(authMiddleware);

// GET /api/products/dropdown/all - Get all products for dropdown (MUST BE BEFORE /:id route)
router.get(
  '/dropdown/all',
  ProductController.getProductsForDropdown
);

// GET /api/products - Get all products with pagination and search
router.get(
  '/',
  ProductController.getAllProducts
);

// GET /api/products/:id - Get product by ID
router.get(
  '/:id',
  ProductController.getProductById
);

// POST /api/products - Create new product (with optional image upload)
router.post(
  '/',
  permissionMiddleware('products', 'create'),
  productImageUpload,
  ProductController.createProduct
);

// PUT /api/products/:id - Update product (with optional image upload)
router.put(
  '/:id',
  permissionMiddleware('products', 'update'),
  productImageUpload,
  ProductController.updateProduct
);

// DELETE /api/products/:id - Delete product
router.delete(
  '/:id',
  permissionMiddleware('products', 'delete'),
  ProductController.deleteProduct
);

module.exports = router;

