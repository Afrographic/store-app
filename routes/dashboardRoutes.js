'use strict';

const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Dashboard Routes
 * All routes are prefixed with /api/dashboard
 */

// Get admin dashboard statistics (protected, admin only)
router.get(
  '/admin/stats',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'dashboard' }),
  dashboardController.getAdminStats
);

// Get recent activities (protected, admin only)
router.get(
  '/recent-activities',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'dashboard_activities' }),
  dashboardController.getRecentActivities
);

// Get category distribution (protected, admin only)
router.get(
  '/category-distribution',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'dashboard_distribution' }),
  dashboardController.getCategoryDistribution
);

// Get supplier contribution (protected, admin only)
router.get(
  '/supplier-contribution',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'dashboard_supplier' }),
  dashboardController.getSupplierContribution
);

module.exports = router;

