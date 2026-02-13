'use strict';

const express = require('express');
const StockoutImpactController = require('../controllers/stockoutImpactController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Stock-Out Impact Analysis Routes
 * All routes are prefixed with /api/stockout-impact
 */

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/stockout-impact
 * @desc    Generate stockout impact analysis for products
 * @access  Private
 * @query   company_id (optional), location_id, product_id, category_id, analysis_days (default: 90)
 * @returns Impact analysis with lost revenue, frequency, and recovery actions
 */
router.get(
  '/',
  ActivityTrack.middleware({ action: 'view', entityType: 'stockout_impact' }),
  StockoutImpactController.generateAnalysis
);

module.exports = router;

