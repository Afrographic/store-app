'use strict';

const posTerminalService = require('../services/posTerminalService');
const activityTrack = require('../utils/activityTrack');

/**
 * POS Terminal Controller
 * Handles HTTP requests for POS terminal operations
 */
class PosTerminalController {
  /**
   * Get all POS terminals
   * GET /api/pos-terminals
   */
  static async getAllPosTerminals(req, res) {
    try {
      const { page, limit, search, location_id, status, company_id, sortBy, sortOrder } = req.query;
      
      // Default company_id to 1 if not provided
      const finalCompanyId = company_id || 1;
      
      console.log('Get all POS terminals query params:', { page, limit, search, location_id, status, company_id: finalCompanyId, sortBy, sortOrder });
      
      const result = await posTerminalService.list({
        page,
        limit,
        search,
        location_id,
        status,
        company_id: finalCompanyId,
        sortBy,
        sortOrder
      });

      console.log('POS Terminals result:', {
        dataCount: result.data?.length,
        pagination: result.pagination
      });

      res.status(200).json({
        success: true,
        message: 'POS terminals retrieved successfully',
        data: result.data,
        pagination: {
          currentPage: result.pagination.currentPage,
          itemsPerPage: result.pagination.itemsPerPage,
          totalItems: result.pagination.totalItems,
          totalPages: result.pagination.totalPages,
          // Also include legacy format for backward compatibility
          page: result.pagination.currentPage,
          limit: result.pagination.itemsPerPage,
          total: result.pagination.totalItems
        }
      });
    } catch (error) {
      console.error('Get all POS terminals error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving POS terminals'
      });
    }
  }

  /**
   * Get POS terminal by ID
   * GET /api/pos-terminals/:id
   */
  static async getPosTerminalById(req, res) {
    try {
      const { id } = req.params;

      const terminal = await posTerminalService.getById(id);
      
      if (!terminal) {
        return res.status(404).json({
          success: false,
          message: 'POS terminal not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('pos_terminal', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'POS terminal retrieved successfully',
        data: terminal
      });
    } catch (error) {
      console.error('Get POS terminal by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving POS terminal'
      });
    }
  }

  /**
   * Create new POS terminal
   * POST /api/pos-terminals
   */
  static async createPosTerminal(req, res) {
    try {
      const { location_id, terminal_name, status, company_id } = req.body;

      // Default company_id to 1 if not provided
      const finalCompanyId = company_id || 1;

      // Basic validation
      if (!location_id || !terminal_name) {
        return res.status(400).json({
          success: false,
          message: 'Location ID and terminal name are required'
        });
      }

      // Validate that location belongs to the specified company
      const { Location } = require('../model');
      const location = await Location.findOne({
        where: {
          location_id: location_id,
          company_id: finalCompanyId
        }
      });

      if (!location) {
        return res.status(400).json({
          success: false,
          message: `Location with ID ${location_id} does not exist or does not belong to company ${finalCompanyId}`
        });
      }

      const terminal = await posTerminalService.create({
        location_id,
        terminal_name,
        status: status || 'ACTIVE'
      });

      // Log create activity with the new terminal ID
      try {
        await activityTrack.created('pos_terminal', terminal.terminal_id, {
          userId: req.user?.user_id,
          description: { company_id: finalCompanyId, location_id, terminal_name, status: terminal.status }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'POS terminal created successfully',
        data: terminal
      });
    } catch (error) {
      console.error('Create POS terminal error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating POS terminal'
      });
    }
  }

  /**
   * Update POS terminal
   * PUT /api/pos-terminals/:id
   */
  static async updatePosTerminal(req, res) {
    try {
      const { id } = req.params;
      const { terminal_name, status, location_id } = req.body;

      console.log('Update POS terminal request:', { id, terminal_name, status, location_id });

      // Check if terminal exists
      const existingTerminal = await posTerminalService.getById(id);
      if (!existingTerminal) {
        return res.status(404).json({
          success: false,
          message: 'POS terminal not found'
        });
      }

      // Prepare update data (only include defined fields)
      const updateData = {};
      if (terminal_name !== undefined) updateData.terminal_name = terminal_name;
      // Explicitly handle status - allow 'ACTIVE' or 'INACTIVE'
      if (status !== undefined && status !== null && status !== '') {
        if (status === 'ACTIVE' || status === 'INACTIVE') {
          updateData.status = status;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Status must be either ACTIVE or INACTIVE'
          });
        }
      }
      if (location_id !== undefined) updateData.location_id = location_id;

      console.log('Update data prepared:', updateData);

      const terminal = await posTerminalService.update(id, updateData);
      
      console.log('Terminal updated successfully:', terminal?.status);

      // Log update activity
      try {
        await activityTrack.updated('pos_terminal', id, {
          userId: req.user?.user_id,
          description: updateData
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'POS terminal updated successfully',
        data: terminal
      });
    } catch (error) {
      console.error('Update POS terminal error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating POS terminal'
      });
    }
  }

  /**
   * Delete POS terminal
   * DELETE /api/pos-terminals/:id
   */
  static async deletePosTerminal(req, res) {
    try {
      const { id } = req.params;

      const terminal = await posTerminalService.getById(id);
      
      if (!terminal) {
        return res.status(404).json({
          success: false,
          message: 'POS terminal not found'
        });
      }

      await posTerminalService.delete(id);

      // Log delete activity
      try {
        await activityTrack.deleted('pos_terminal', id, {
          userId: req.user?.user_id,
          description: { terminal_name: terminal.terminal_name }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'POS terminal deleted successfully'
      });
    } catch (error) {
      console.error('Delete POS terminal error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting POS terminal'
      });
    }
  }

  /**
   * Get all POS terminals for dropdown (no pagination)
   * GET /api/pos-terminals/dropdown/all
   */
  static async getPosTerminalsForDropdown(req, res) {
    try {
      const { location_id, status } = req.query;
      
      const terminals = await posTerminalService.getAllForDropdown({
        location_id,
        status
      });

      res.status(200).json({
        success: true,
        message: 'POS terminals retrieved successfully',
        data: terminals
      });
    } catch (error) {
      console.error('Get POS terminals for dropdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving POS terminals for dropdown'
      });
    }
  }
}

module.exports = PosTerminalController;

