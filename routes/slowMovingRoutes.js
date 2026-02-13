'use strict';

const express = require('express');
const SlowMovingController = require('../controllers/slowMovingController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

// Apply authentication to all slow-moving routes
router.use(authMiddleware);

/**
 * @route   GET /api/slow-moving
 * @desc    Generate slow-moving inventory alerts
 * @access  Private
 */
router.get(
  '/',
  ActivityTrack.middleware({ action: 'view', entityType: 'slow_moving' }),
  SlowMovingController.getAlerts
);

module.exports = router;


