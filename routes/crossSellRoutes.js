'use strict';

const express = require('express');
const CrossSellController = require('../controllers/crossSellController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

// Apply authentication to all cross-sell routes
router.use(authMiddleware);

// GET /api/cross-sell
router.get(
  '/',
  ActivityTrack.middleware({ action: 'view', entityType: 'cross_sell' }),
  CrossSellController.generate
);

module.exports = router;


