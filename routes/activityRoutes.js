'use strict';

const express = require('express');
const ActivityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Activity Routes
 * All routes are prefixed with /api/activities
 */

// Apply authentication to all activity routes
router.use(authMiddleware);

// GET /api/activities/filters/actions - Get unique actions for filter dropdown (MUST BE BEFORE /:id route)
router.get(
  '/filters/actions',
  ActivityController.getUniqueActions
);

// GET /api/activities/filters/entity-types - Get unique entity types for filter dropdown (MUST BE BEFORE /:id route)
router.get(
  '/filters/entity-types',
  ActivityController.getUniqueEntityTypes
);

// GET /api/activities - Get all activities with pagination and filters
router.get(
  '/',
  ActivityController.getAllActivities
);

// GET /api/activities/:id - Get activity by ID
router.get(
  '/:id',
  ActivityController.getActivityById
);

module.exports = router;

