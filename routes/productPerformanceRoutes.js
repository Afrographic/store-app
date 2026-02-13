'use strict';

const express = require('express');
const ProductPerformanceController = require('../controllers/productPerformanceController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Product Performance Routes
 * All routes are prefixed with /api/product-performance
 */

router.use(authMiddleware);

/**
 * @route   GET /api/product-performance
 * @desc    Generate product performance analysis
 * @access  Private
 * @query   company_id (optional if user has company), location_id, category_id, historical_days (default: 365)
 */
router.get(
  '/',
  ActivityTrack.middleware({ action: 'view', entityType: 'product_performance' }),
  ProductPerformanceController.generateAnalysis
);

module.exports = router;

