'use strict';

const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const ActivityTrack = require('../utils/activityTrack');

const router = express.Router();

/**
 * Report Routes
 * All routes are prefixed with /api/reports
 */

// Get critical stock levels by location (protected)
router.get(
  '/critical-stock-levels',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'report_critical_stock' }),
  reportController.getCriticalStockLevels
);

// Get stock summary by location (protected)
router.get(
  '/stock-summary',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'report_stock_summary' }),
  reportController.getStockSummaryByLocation
);

// Get zero quantity alerts by location (protected)
router.get(
  '/zero-quantity-alerts',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'report_zero_quantity' }),
  reportController.getZeroQuantityAlerts
);

// Get supplier supply analysis (protected)
router.get(
  '/supplier-supply-analysis',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'report_supplier_supply' }),
  reportController.getSupplierSupplyAnalysis
);

// Get product purchase analysis (protected)
router.get(
  '/product-purchase-analysis',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'report_product_purchase' }),
  reportController.getProductPurchaseAnalysis
);

// Get selling report (protected)
router.get(
  '/selling-report',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'report_selling' }),
  reportController.getSellingReport
);

// Get purchase report (protected)
router.get(
  '/purchase-report',
  authMiddleware,
  ActivityTrack.middleware({ action: 'view', entityType: 'report_purchase' }),
  reportController.getPurchaseReport
);

module.exports = router;


