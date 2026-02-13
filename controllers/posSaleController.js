'use strict';

const posSaleService = require('../services/posSaleService');
const activityTrack = require('../utils/activityTrack');
const { ENUMS } = require('../utils/constants');

/**
 * POS Sale Controller
 * Handles HTTP requests for POS sale operations
 * Manages both PosSale and PosSaleItem tables together
 */
class PosSaleController {
  /**
   * Get all POS sales
   * GET /api/pos-sales
   */
  static async getAllPosSales(req, res) {
    try {
      const {
        page,
        limit,
        company_id,
        location_id,
        terminal_id,
        client_id,
        cashier_id,
        payment_status,
        status,
        from_date,
        to_date,
        search
      } = req.query;

      // Default company_id to 1 if not provided
      const finalCompanyId = company_id || 1;

      const result = await posSaleService.list({
        page,
        limit,
        company_id: finalCompanyId,
        location_id,
        terminal_id,
        client_id,
        cashier_id,
        payment_status,
        status,
        from_date,
        to_date,
        search
      });

      res.status(200).json({
        success: true,
        message: 'POS sales retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all POS sales error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while retrieving POS sales'
      });
    }
  }

  /**
   * Get POS sale by ID
   * GET /api/pos-sales/:id
   */
  static async getPosSaleById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid sale ID is required'
        });
      }

      const sale = await posSaleService.getById(parseInt(id));

      // Log view activity
      try {
        await activityTrack.viewed('pos_sale', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'POS sale retrieved successfully',
        data: sale
      });
    } catch (error) {
      console.error('Get POS sale by ID error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while retrieving POS sale'
      });
    }
  }

  /**
   * Create new POS sale with sale items
   * POST /api/pos-sales
   */
  static async createPosSale(req, res) {
    try {
      const {
        company_id,
        location_id,
        terminal_id,
        client_id,
        cashier_id,
        sale_date,
        subtotal,
        discount,
        tax,
        total_amount,
        payment_method_id,
        payment_status,
        status,
        notes,
        saleItems
      } = req.body;

      // Default company_id to 1 if not provided
      const finalCompanyId = company_id || 1;

      // Use current user as cashier if not provided
      const finalCashierId = cashier_id || req.user?.user_id;

      // Basic validation
      if (!location_id) {
        return res.status(400).json({
          success: false,
          message: 'Location ID is required'
        });
      }

      if (!finalCashierId) {
        return res.status(400).json({
          success: false,
          message: 'Cashier ID is required'
        });
      }

      if (!payment_method_id) {
        return res.status(400).json({
          success: false,
          message: 'Payment method ID is required'
        });
      }

      if (!saleItems || !Array.isArray(saleItems) || saleItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one sale item is required'
        });
      }

      // Validate payment_status if provided
      if (payment_status && !ENUMS.POS_PAYMENT_STATUS.includes(payment_status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment status. Must be ${ENUMS.POS_PAYMENT_STATUS.join(' or ')}`
        });
      }

      // Validate status if provided
      if (status && !ENUMS.POS_SALE_STATUS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be ${ENUMS.POS_SALE_STATUS.join(' or ')}`
        });
      }

      // Determine final payment_status and status
      const finalPaymentStatus = payment_status || 'PAID';
      // If status is not explicitly provided, set it based on payment_status
      // If payment_status is PENDING, then status should be PENDING
      // Otherwise, status should be COMPLETED
      const finalStatus = status || (finalPaymentStatus === 'PENDING' ? 'PENDING' : 'COMPLETED');

      const sale = await posSaleService.create({
        company_id: finalCompanyId,
        location_id,
        terminal_id,
        client_id,
        cashier_id: finalCashierId,
        sale_date,
        subtotal,
        discount,
        tax,
        total_amount,
        payment_method_id,
        payment_status: finalPaymentStatus,
        status: finalStatus,
        notes,
        saleItems
      }, req.user?.user_id);

      // Log create activity
      try {
        await activityTrack.created('pos_sale', sale.sale_id, {
          userId: req.user?.user_id,
          description: { invoice_number: sale.invoice_number, total_amount: sale.total_amount }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'POS sale created successfully',
        data: sale
      });
    } catch (error) {
      console.error('Create POS sale error:', error);

      // Handle validation errors
      if (error.message.includes('required') || 
          error.message.includes('must be') ||
          error.message.includes('Invalid') ||
          error.message.includes('Insufficient stock')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while creating POS sale'
      });
    }
  }

  /**
   * Update existing POS sale
   * PUT /api/pos-sales/:id
   */
  static async updatePosSale(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid sale ID is required'
        });
      }

      const {
        location_id,
        terminal_id,
        client_id,
        sale_date,
        subtotal,
        discount,
        tax,
        total_amount,
        payment_method_id,
        payment_status,
        status,
        notes,
        saleItems
      } = req.body;

      // Validate payment_status if provided
      if (payment_status && !ENUMS.POS_PAYMENT_STATUS.includes(payment_status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment status. Must be ${ENUMS.POS_PAYMENT_STATUS.join(' or ')}`
        });
      }

      // Validate status if provided
      if (status && !ENUMS.POS_SALE_STATUS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be ${ENUMS.POS_SALE_STATUS.join(' or ')}`
        });
      }

      const sale = await posSaleService.update(parseInt(id), {
        location_id,
        terminal_id,
        client_id,
        sale_date,
        subtotal,
        discount,
        tax,
        total_amount,
        payment_method_id,
        payment_status,
        status,
        notes,
        saleItems
      }, req.user?.user_id);

      // Log update activity
      try {
        await activityTrack.updated('pos_sale', id, {
          userId: req.user?.user_id,
          description: { invoice_number: sale.invoice_number }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'POS sale updated successfully',
        data: sale
      });
    } catch (error) {
      console.error('Update POS sale error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('required') || 
          error.message.includes('must be') ||
          error.message.includes('Invalid') ||
          error.message.includes('Cannot update')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while updating POS sale'
      });
    }
  }

  /**
   * Delete POS sale
   * DELETE /api/pos-sales/:id
   */
  static async deletePosSale(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid sale ID is required'
        });
      }

      // Get sale details before deletion for activity log
      const sale = await posSaleService.getById(parseInt(id));

      await posSaleService.delete(parseInt(id));

      // Log delete activity
      try {
        await activityTrack.deleted('pos_sale', id, {
          userId: req.user?.user_id,
          description: { invoice_number: sale.invoice_number }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'POS sale deleted successfully'
      });
    } catch (error) {
      console.error('Delete POS sale error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while deleting POS sale'
      });
    }
  }

  /**
   * Cancel POS sale
   * POST /api/pos-sales/:id/cancel
   */
  static async cancelPosSale(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid sale ID is required'
        });
      }

      const sale = await posSaleService.update(parseInt(id), {
        status: 'CANCELLED'
      }, req.user?.user_id);

      // Log cancel activity
      try {
        await activityTrack.updated('pos_sale', id, {
          userId: req.user?.user_id,
          description: { action: 'cancelled', invoice_number: sale.invoice_number }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'POS sale cancelled successfully',
        data: sale
      });
    } catch (error) {
      console.error('Cancel POS sale error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Cannot update')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while cancelling POS sale'
      });
    }
  }
}

module.exports = PosSaleController;

