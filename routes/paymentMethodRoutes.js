'use strict';

const express = require('express');
const PaymentMethodController = require('../controllers/paymentMethodController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');

const router = express.Router();

/**
 * Payment Method Routes
 * All routes are prefixed with /api/payment-methods
 */

// Apply authentication to all payment method routes
router.use(authMiddleware);

// GET /api/payment-methods/dropdown - Get all payment methods without pagination (for dropdowns)
router.get(
  '/dropdown',
  permissionMiddleware('paymentMethods', 'read'),
  PaymentMethodController.getPaymentMethodsDropdown
);

// GET /api/payment-methods - Get all payment methods with pagination and search
router.get(
  '/',
  permissionMiddleware('paymentMethods', 'read'),
  PaymentMethodController.getAllPaymentMethods
);

// GET /api/payment-methods/:id - Get payment method by ID
router.get(
  '/:id',
  permissionMiddleware('paymentMethods', 'read'),
  PaymentMethodController.getPaymentMethodById
);

// POST /api/payment-methods - Create new payment method
router.post(
  '/',
  permissionMiddleware('paymentMethods', 'create'),
  PaymentMethodController.createPaymentMethod
);

// PUT /api/payment-methods/:id - Update payment method
router.put(
  '/:id',
  permissionMiddleware('paymentMethods', 'update'),
  PaymentMethodController.updatePaymentMethod
);

// DELETE /api/payment-methods/:id - Delete payment method
router.delete(
  '/:id',
  permissionMiddleware('paymentMethods', 'delete'),
  PaymentMethodController.deletePaymentMethod
);

module.exports = router;

