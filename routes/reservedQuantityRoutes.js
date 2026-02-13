const express = require('express');
const router = express.Router();
const reservedQuantityController = require('../controllers/reservedQuantityController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/reserved-quantities
 * @desc Get reserved quantities from inventory table
 * @access Private
 */
router.get('/', permissionMiddleware('reservedQuantity', 'read'), reservedQuantityController.getReservedQuantities);

/**
 * @route PUT /api/reserved-quantities
 * @desc Store/Update reserved quantities in inventory table
 * @access Private
 */
router.put('/', permissionMiddleware('reservedQuantity', 'update'), reservedQuantityController.storeReservedQuantities);

module.exports = router;
