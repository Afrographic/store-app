'use strict';

const express = require('express');
const CategoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Category Routes
 * All routes are prefixed with /api/categories
 */

// Apply authentication to all category routes
router.use(authMiddleware);

// GET /api/categories/dropdown - Get all categories without pagination (for dropdowns)
router.get(
  '/dropdown',
  permissionMiddleware('categories', 'read'),
  CategoryController.getCategoriesDropdown
);

// GET /api/categories - Get all categories with pagination and search
router.get(
  '/',
  permissionMiddleware('categories', 'read'),
  CategoryController.getAllCategories
);

// GET /api/categories/:id - Get category by ID
router.get(
  '/:id',
  permissionMiddleware('categories', 'read'),
  CategoryController.getCategoryById
);

// POST /api/categories - Create new category
router.post(
  '/',
  permissionMiddleware('categories', 'create'),
  CategoryController.createCategory
);

// PUT /api/categories/:id - Update category
router.put(
  '/:id',
  permissionMiddleware('categories', 'update'),
  CategoryController.updateCategory
);

// DELETE /api/categories/:id - Delete category
router.delete(
  '/:id',
  permissionMiddleware('categories', 'delete'),
  CategoryController.deleteCategory
);

module.exports = router;

