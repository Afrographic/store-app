'use strict';

const paymentMethodService = require('../services/paymentMethodService');
const activityTrack = require('../utils/activityTrack');

/**
 * Payment Method Controller
 * Handles HTTP requests for payment method operations
 */
class PaymentMethodController {
  /**
   * Get payment methods dropdown (no pagination)
   * GET /api/payment-methods/dropdown
   */
  static async getPaymentMethodsDropdown(req, res) {
    try {
      const { company_id = 1, is_active } = req.query;

      const paymentMethods = await paymentMethodService.listAll({
        company_id: company_id || 1,
        is_active: is_active !== undefined ? is_active : true,
        sortBy: 'name',
        sortOrder: 'ASC'
      });

      res.status(200).json({
        success: true,
        message: 'Payment methods retrieved successfully',
        data: paymentMethods
      });
    } catch (error) {
      console.error('Get payment methods dropdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving payment methods'
      });
    }
  }

  /**
   * Get all payment methods
   * GET /api/payment-methods
   */
  static async getAllPaymentMethods(req, res) {
    try {
      const { page, limit, search, company_id, is_active, sortBy, sortOrder } = req.query;
      
      // Build query params
      const queryParams = {
        page,
        limit,
        search,
        company_id,
        sortBy,
        sortOrder
      };

      // Add is_active filter if provided
      if (is_active !== undefined) {
        queryParams.is_active = is_active === 'true' || is_active === true;
      }
      
      const result = await paymentMethodService.list(queryParams);

      res.status(200).json({
        success: true,
        message: 'Payment methods retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all payment methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving payment methods'
      });
    }
  }

  /**
   * Get payment method by ID
   * GET /api/payment-methods/:id
   */
  static async getPaymentMethodById(req, res) {
    try {
      const { id } = req.params;

      const paymentMethod = await paymentMethodService.getById(id);
      
      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('payment_method', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Payment method retrieved successfully',
        data: paymentMethod
      });
    } catch (error) {
      console.error('Get payment method by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving payment method'
      });
    }
  }

  /**
   * Create new payment method
   * POST /api/payment-methods
   */
  static async createPaymentMethod(req, res) {
    try {
      const { company_id, name, type, is_active } = req.body;

      // Basic validation
      if (!company_id || !name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Company ID, name, and type are required'
        });
      }

      const paymentMethod = await paymentMethodService.create({
        company_id,
        name,
        type,
        is_active: is_active !== undefined ? is_active : true
      });

      // Log create activity
      try {
        await activityTrack.created('payment_method', paymentMethod.payment_method_id, {
          userId: req.user?.user_id,
          description: { company_id, name, type, is_active }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'Payment method created successfully',
        data: paymentMethod
      });
    } catch (error) {
      console.error('Create payment method error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating payment method'
      });
    }
  }

  /**
   * Update payment method
   * PUT /api/payment-methods/:id
   */
  static async updatePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const { name, type, is_active } = req.body;

      // Check if payment method exists
      const existingPaymentMethod = await paymentMethodService.getById(id);
      if (!existingPaymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      // Prepare update data (only include defined fields)
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (is_active !== undefined) updateData.is_active = is_active;

      const paymentMethod = await paymentMethodService.update(id, updateData);

      // Log update activity
      try {
        await activityTrack.updated('payment_method', id, {
          userId: req.user?.user_id,
          description: updateData
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Payment method updated successfully',
        data: paymentMethod
      });
    } catch (error) {
      console.error('Update payment method error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating payment method'
      });
    }
  }

  /**
   * Delete payment method
   * DELETE /api/payment-methods/:id
   */
  static async deletePaymentMethod(req, res) {
    try {
      const { id } = req.params;

      const paymentMethod = await paymentMethodService.getById(id);
      
      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      await paymentMethodService.delete(id);

      // Log delete activity
      try {
        await activityTrack.deleted('payment_method', id, {
          userId: req.user?.user_id,
          description: { name: paymentMethod.name }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Payment method deleted successfully'
      });
    } catch (error) {
      console.error('Delete payment method error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting payment method'
      });
    }
  }
}

module.exports = PaymentMethodController;

