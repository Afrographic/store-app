'use strict';

const stockMovementService = require('../services/stockMovementService');

/**
 * Stock Movement Controller
 * Handles HTTP requests for stock movement operations
 */
class StockMovementController {
  /**
   * Get all stock movements
   * GET /api/stockMovements
   */
  static async getAllStockMovements(req, res) {
    try {
      const { page, limit, product_id, location_id, movement_type, reference_type } = req.query;
      
      const result = await stockMovementService.list({
        page,
        limit,
        product_id,
        location_id,
        movement_type,
        reference_type
      });

      res.status(200).json({
        success: true,
        message: 'Stock movements retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all stock movements error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while retrieving stock movements'
      });
    }
  }

  /**
   * Create new stock movement
   * POST /api/stockMovements
   */
  static async createStockMovement(req, res) {
    try {
      const {
        product_id,
        location_id,
        quantity,
        movement_type,
        reference_type,
        reference_id
      } = req.body;

      // Validation
      if (!product_id) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      if (!location_id) {
        return res.status(400).json({
          success: false,
          message: 'Location ID is required'
        });
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }

      if (!movement_type) {
        return res.status(400).json({
          success: false,
          message: 'Movement type is required (IN or OUT)'
        });
      }

      if (!reference_type) {
        return res.status(400).json({
          success: false,
          message: 'Reference type is required (OPENING_STOCK, ADJUSTMENT, TRANSFER, or ORDER_PURCHASE)'
        });
      }

      // Validate allowed combinations
      const allowedReferenceTypes = ['OPENING_STOCK', 'ADJUSTMENT', 'TRANSFER', 'ORDER_PURCHASE'];
      if (!allowedReferenceTypes.includes(reference_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid reference_type. Allowed values: ${allowedReferenceTypes.join(', ')}`
        });
      }

      // For OPENING_STOCK and ORDER_PURCHASE, only IN is allowed
      if ((reference_type === 'OPENING_STOCK' || reference_type === 'ORDER_PURCHASE') && movement_type !== 'IN') {
        return res.status(400).json({
          success: false,
          message: `${reference_type} can only have movement_type IN`
        });
      }

      const stockMovement = await stockMovementService.create({
        product_id,
        location_id,
        quantity,
        movement_type,
        reference_type,
        reference_id,
        created_by: req.user?.user_id
      });

      res.status(201).json({
        success: true,
        message: 'Stock movement created successfully',
        data: stockMovement
      });
    } catch (error) {
      console.error('Create stock movement error:', error);
      
      // Handle specific errors
      if (error.message.includes('Quantity is not available')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Insufficient inventory')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('No inventory record exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while creating stock movement'
      });
    }
  }

  /**
   * Get inventory quantity for validation
   * GET /api/stockMovements/inventory/:product_id/:location_id
   */
  static async getInventoryQuantity(req, res) {
    try {
      const { product_id, location_id } = req.params;

      const quantity = await stockMovementService.getInventoryQuantity(
        parseInt(product_id),
        parseInt(location_id)
      );

      res.status(200).json({
        success: true,
        message: 'Inventory quantity retrieved successfully',
        data: { quantity }
      });
    } catch (error) {
      console.error('Get inventory quantity error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while retrieving inventory quantity'
      });
    }
  }
}

module.exports = StockMovementController;

