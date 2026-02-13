'use strict';

const express = require('express');
const SettingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Settings Routes
 * All routes are prefixed with /api/settings
 */

// Public route for organization logo (no auth required)
// GET /api/settings/public/logo - Get organization logo for login/signup pages
router.get('/public/logo', SettingsController.getOrganizationLogo);

// Apply authentication middleware to all other routes
router.use(authMiddleware);

// GET /api/settings - Get all settings for a company (includes settings keys configuration)
router.get('/', SettingsController.getSettings);

// PATCH /api/settings/:company_id/:setting_key - Update or create a setting (upsert)
router.patch('/:company_id/:setting_key', SettingsController.updateSetting);

module.exports = router;
