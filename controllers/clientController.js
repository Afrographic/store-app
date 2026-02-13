'use strict';

const clientService = require('../services/clientService');
const activityTrack = require('../utils/activityTrack');

/**
 * Client Controller
 * Handles HTTP requests for client operations
 */
class ClientController {
  /**
   * Get all clients
   * GET /api/clients
   */
  static async getAllClients(req, res) {
    try {
      const { page, limit, search, company_id, sortBy, sortOrder } = req.query;
      
      const result = await clientService.list({
        page,
        limit,
        search,
        company_id,
        sortBy,
        sortOrder
      });

      res.status(200).json({
        success: true,
        message: 'Clients retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all clients error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving clients'
      });
    }
  }

  /**
   * Get client by ID
   * GET /api/clients/:id
   */
  static async getClientById(req, res) {
    try {
      const { id } = req.params;

      const client = await clientService.getById(id);
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('client', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Client retrieved successfully',
        data: client
      });
    } catch (error) {
      console.error('Get client by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving client'
      });
    }
  }

  /**
   * Create new client
   * POST /api/clients
   */
  static async createClient(req, res) {
    try {
      const { company_id, name, contact_name, email, phone, address } = req.body;

      // Basic validation
      if (!company_id || !name) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and client name are required'
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

      const client = await clientService.create({
        company_id,
        name,
        contact_name,
        email,
        phone,
        address
      });

      // Log create activity
      try {
        await activityTrack.created('client', client.client_id, {
          userId: req.user?.user_id,
          description: { company_id, name, contact_name, email }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: client
      });
    } catch (error) {
      console.error('Create client error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating client'
      });
    }
  }

  /**
   * Update client
   * PUT /api/clients/:id
   */
  static async updateClient(req, res) {
    try {
      const { id } = req.params;
      const { name, contact_name, email, phone, address } = req.body;

      // Check if client exists
      const existingClient = await clientService.getById(id);
      if (!existingClient) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
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

      const client = await clientService.update(id, updateData);

      // Log update activity
      try {
        await activityTrack.updated('client', id, {
          userId: req.user?.user_id,
          description: updateData
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Client updated successfully',
        data: client
      });
    } catch (error) {
      console.error('Update client error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating client'
      });
    }
  }

  /**
   * Delete client
   * DELETE /api/clients/:id
   */
  static async deleteClient(req, res) {
    try {
      const { id } = req.params;

      const client = await clientService.getById(id);
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      await clientService.delete(id);

      // Log delete activity
      try {
        await activityTrack.deleted('client', id, {
          userId: req.user?.user_id,
          description: { name: client.name }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Client deleted successfully'
      });
    } catch (error) {
      console.error('Delete client error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting client'
      });
    }
  }

  /**
   * Get all clients for dropdown (no pagination)
   * GET /api/clients/dropdown/all
   */
  static async getClientsForDropdown(req, res) {
    try {
      const { company_id } = req.query;
      
      const clients = await clientService.getAllForDropdown({
        company_id
      });

      res.status(200).json({
        success: true,
        message: 'Clients retrieved successfully',
        data: clients
      });
    } catch (error) {
      console.error('Get clients for dropdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving clients for dropdown'
      });
    }
  }
}

module.exports = ClientController;

