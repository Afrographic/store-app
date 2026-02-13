'use strict';

const express = require('express');
const ForecastController = require('../controllers/forecastController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Forecast Routes
 * All routes are prefixed with /api/forecast
 * Provides AI-powered demand forecasting endpoints
 */

// Apply authentication to all forecast routes
router.use(authMiddleware);

/**
 * @route   GET /api/forecast
 * @desc    Generate demand forecast for products
 * @access  Private
 * @query   company_id (optional if user has company), location_id, product_id, category_id, historical_days (default: 365)
 * @returns Demand forecasts for 30/60/90 days with confidence levels and risk indicators
 */
router.get(
  '/',
  ActivityTrack.middleware({ action: 'view', entityType: 'forecast' }),
  ForecastController.generateForecast
);

/**
 * @route   GET /api/forecast/product/:productId
 * @desc    Get forecast for a specific product
 * @access  Private
 * @params  productId - Product ID
 * @query   company_id (optional if user has company), location_id
 * @returns Product-specific forecast with detailed predictions
 */
router.get(
  '/product/:productId',
  ActivityTrack.middleware({ action: 'view', entityType: 'forecast_product' }),
  ForecastController.getProductForecast
);

module.exports = router;

