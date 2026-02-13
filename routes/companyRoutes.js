'use strict';

const express = require('express');
const CompanyController = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

// Apply authentication to all company routes
router.use(authMiddleware);

// GET /api/companies/:id - Get a company by ID
router.get(
  '/:id',
  CompanyController.getCompanyById
);

// PUT /api/companies/:id - Update a company
router.put(
  '/:id',
  CompanyController.updateCompany
);

module.exports = router;


