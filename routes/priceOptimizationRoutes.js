'use strict';

const express = require('express');
const PriceOptimizationController = require('../controllers/priceOptimizationController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

// Apply authentication to all price optimization routes
router.use(authMiddleware);

// GET /api/price-optimization
router.get(
  '/',
  ActivityTrack.middleware({ action: 'view', entityType: 'price_optimization' }),
  PriceOptimizationController.generateRecommendations
);

// GET /api/price-optimization/product/:productId
router.get(
  '/product/:productId',
  ActivityTrack.middleware({ action: 'view', entityType: 'price_optimization_product' }),
  PriceOptimizationController.getProductRecommendation
);

module.exports = router;


