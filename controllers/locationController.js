'use strict';

const locationService = require('../services/locationService');
const activityTrack = require('../utils/activityTrack');

/**
 * Location Controller
 * Handles HTTP requests for location operations
 */
class LocationController {
  /**
   * Get all locations
   * GET /api/locations
   */
  static async getAllLocations(req, res) {
    try {
      const { page, limit, search, company_id, sortBy, sortOrder } = req.query;
      
      console.log('Get all locations query params:', { page, limit, search, company_id, sortBy, sortOrder });
      
      const result = await locationService.list({
        page,
        limit,
        search,
        company_id,
        sortBy,
        sortOrder
      });

      console.log('Locations result:', {
        dataCount: result.data?.length,
        pagination: result.pagination
      });

      res.status(200).json({
        success: true,
        message: 'Locations retrieved successfully',
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
      console.error('Get all locations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving locations'
      });
    }
  }

  /**
   * Get location by ID
   * GET /api/locations/:id
   */
  static async getLocationById(req, res) {
    try {
      const { id } = req.params;

      const location = await locationService.getById(id);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('location', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Location retrieved successfully',
        data: location
      });
    } catch (error) {
      console.error('Get location by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving location'
      });
    }
  }

  /**
   * Create new location
   * POST /api/locations
   */
  static async createLocation(req, res) {
    try {
      const { company_id, name, address, phone } = req.body;

      // Basic validation
      if (!company_id || !name) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and location name are required'
        });
      }

      const location = await locationService.create({
        company_id,
        name,
        address,
        phone
      });

      // Log create activity with the new location ID
      try {
        await activityTrack.created('location', location.location_id, {
          userId: req.user?.user_id,
          description: { company_id, name, address, phone }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'Location created successfully',
        data: location
      });
    } catch (error) {
      console.error('Create location error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating location'
      });
    }
  }

  /**
   * Update location
   * PUT /api/locations/:id
   */
  static async updateLocation(req, res) {
    try {
      const { id } = req.params;
      const { name, address, phone } = req.body;

      // Check if location exists
      const existingLocation = await locationService.getById(id);
      if (!existingLocation) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Prepare update data (only include defined fields)
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;

      const location = await locationService.update(id, updateData);

      // Log update activity
      try {
        await activityTrack.updated('location', id, {
          userId: req.user?.user_id,
          description: updateData
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: location
      });
    } catch (error) {
      console.error('Update location error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating location'
      });
    }
  }

  /**
   * Delete location
   * DELETE /api/locations/:id
   */
  static async deleteLocation(req, res) {
    try {
      const { id } = req.params;

      const location = await locationService.getById(id);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      await locationService.delete(id);

      // Log delete activity
      try {
        await activityTrack.deleted('location', id, {
          userId: req.user?.user_id,
          description: { name: location.name }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Location deleted successfully'
      });
    } catch (error) {
      console.error('Delete location error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting location'
      });
    }
  }

  /**
   * Get all locations for dropdown (no pagination)
   * GET /api/locations/dropdown/all
   */
  static async getLocationsForDropdown(req, res) {
    try {
      const { company_id } = req.query;
      
      const locations = await locationService.getAllForDropdown({
        company_id
      });

      res.status(200).json({
        success: true,
        message: 'Locations retrieved successfully',
        data: locations
      });
    } catch (error) {
      console.error('Get locations for dropdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving locations for dropdown'
      });
    }
  }
}

module.exports = LocationController;

