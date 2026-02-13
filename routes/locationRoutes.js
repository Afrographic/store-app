'use strict';

const express = require('express');
const LocationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Location Routes
 * All routes are prefixed with /api/locations
 */

// Apply authentication to all location routes
router.use(authMiddleware);

// GET /api/locations/dropdown/all - Get all locations for dropdown (MUST BE BEFORE /:id route)
router.get(
  '/dropdown/all',
  permissionMiddleware('locations', 'read'),
  LocationController.getLocationsForDropdown
);

// GET /api/locations - Get all locations with pagination and search
router.get(
  '/',
  permissionMiddleware('locations', 'read'),
  LocationController.getAllLocations
);

// GET /api/locations/:id - Get location by ID
router.get(
  '/:id',
  permissionMiddleware('locations', 'read'),
  LocationController.getLocationById
);

// POST /api/locations - Create new location
router.post(
  '/',
  permissionMiddleware('locations', 'create'),
  LocationController.createLocation
);

// PUT /api/locations/:id - Update location
router.put(
  '/:id',
  permissionMiddleware('locations', 'update'),
  LocationController.updateLocation
);

// DELETE /api/locations/:id - Delete location
router.delete(
  '/:id',
  permissionMiddleware('locations', 'delete'),
  LocationController.deleteLocation
);

module.exports = router;

