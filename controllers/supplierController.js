'use strict';

const supplierService = require('../services/supplierService');
const activityTrack = require('../utils/activityTrack');

/**
 * Supplier Controller
 * Handles HTTP requests for supplier operations
 */
class SupplierController {
  /**
   * Get all suppliers
   * GET /api/suppliers
   */
  static async getAllSuppliers(req, res) {
    try {
      const { page, limit, search, company_id, sortBy, sortOrder } = req.query;
      
      const result = await supplierService.list({
        page,
        limit,
        search,
        company_id,
        sortBy,
        sortOrder
      });

      res.status(200).json({
        success: true,
        message: 'Suppliers retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all suppliers error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving suppliers'
      });
    }
  }

  /**
   * Get supplier by ID
   * GET /api/suppliers/:id
   */
  static async getSupplierById(req, res) {
    try {
      const { id } = req.params;

      const supplier = await supplierService.getById(id);
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('supplier', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Supplier retrieved successfully',
        data: supplier
      });
    } catch (error) {
      console.error('Get supplier by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving supplier'
      });
    }
  }

  /**
   * Create new supplier
   * POST /api/suppliers
   */
  static async createSupplier(req, res) {
    try {
      const { company_id, name, contact_name, email, phone, address } = req.body;

      // Basic validation
      if (!company_id || !name) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and supplier name are required'
        });
      }

      // Email validation if provided
      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }
      }

      const supplier = await supplierService.create({
        company_id,
        name,
        contact_name,
        email,
        phone,
        address
      });

      // Log create activity
      try {
        await activityTrack.created('supplier', supplier.supplier_id, {
          userId: req.user?.user_id,
          description: { company_id, name, contact_name, email }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier
      });
    } catch (error) {
      console.error('Create supplier error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating supplier'
      });
    }
  }

  /**
   * Update supplier
   * PUT /api/suppliers/:id
   */
  static async updateSupplier(req, res) {
    try {
      const { id } = req.params;
      const { name, contact_name, email, phone, address } = req.body;

      // Check if supplier exists
      const existingSupplier = await supplierService.getById(id);
      if (!existingSupplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      // Email validation if provided
      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }
      }

      // Prepare update data (only include defined fields)
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (contact_name !== undefined) updateData.contact_name = contact_name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;

      const supplier = await supplierService.update(id, updateData);

      // Log update activity
      try {
        await activityTrack.updated('supplier', id, {
          userId: req.user?.user_id,
          description: updateData
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier
      });
    } catch (error) {
      console.error('Update supplier error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating supplier'
      });
    }
  }

  /**
   * Delete supplier
   * DELETE /api/suppliers/:id
   */
  static async deleteSupplier(req, res) {
    try {
      const { id } = req.params;

      const supplier = await supplierService.getById(id);
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      await supplierService.delete(id);

      // Log delete activity
      try {
        await activityTrack.deleted('supplier', id, {
          userId: req.user?.user_id,
          description: { name: supplier.name }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Supplier deleted successfully'
      });
    } catch (error) {
      console.error('Delete supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting supplier'
      });
    }
  }

  /**
   * Get all suppliers for dropdown (no pagination)
   * GET /api/suppliers/dropdown/all
   */
  static async getSuppliersForDropdown(req, res) {
    try {
      const { company_id } = req.query;
      
      const suppliers = await supplierService.getAllForDropdown({
        company_id
      });

      res.status(200).json({
        success: true,
        message: 'Suppliers retrieved successfully',
        data: suppliers
      });
    } catch (error) {
      console.error('Get suppliers for dropdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving suppliers for dropdown'
      });
    }
  }
}

module.exports = SupplierController;

