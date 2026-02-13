'use strict';

const { Op } = require('sequelize');
const { Company } = require('../model');
const companyService = require('../services/companyService');
const activityTrack = require('../utils/activityTrack');

/**
 * Company Controller
 * Handles HTTP requests for company operations
 */
class CompanyController {
  /**
   * Get company by ID
   * GET /api/companies/:id
   */
  static async getCompanyById(req, res) {
    try {
      const { id } = req.params;

      const company = await companyService.getById(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      try {
        await activityTrack.viewed('company', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Company retrieved successfully',
        data: company
      });
    } catch (error) {
      console.error('Get company by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving company'
      });
    }
  }

  /**
   * Update company
   * PUT /api/companies/:id
   */
  static async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, address, logo_url, currency, date_format, timezone } = req.body;

      const company = await Company.findByPk(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      // Basic validations aligned with model
      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
      }

      // Prepare update data (only include defined fields)
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (logo_url !== undefined) updateData.logo_url = logo_url || null;
      if (currency !== undefined) updateData.currency = currency;
      if (date_format !== undefined) updateData.date_format = date_format;
      if (timezone !== undefined) updateData.timezone = timezone;

      // Update allowed fields only
      const updated = await companyService.update(id, updateData);

      try {
        await activityTrack.updated('company', id, { userId: req.user?.user_id, description: req.body });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: updated
      });
    } catch (error) {
      console.error('Update company error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating company',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = CompanyController;


