'use strict';

const SettingsService = require('../services/settingsService');
const { SETTINGS_KEYS } = require('../utils/constants');

/**
 * Settings Controller
 * Handles HTTP requests for settings operations
 */
class SettingsController {
  /**
   * Get all settings for a company (includes settings keys configuration)
   * GET /api/settings
   */
  static async getSettings(req, res) {
    try {
      const { company_id } = req.query;
      
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      // Parse company_id to integer
      const companyId = parseInt(company_id, 10);

      if (isNaN(companyId) || companyId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID'
        });
      }

      const settings = await SettingsService.getSettingsByCompany(companyId);

      res.status(200).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: {
          settings: settings,
          keys: SETTINGS_KEYS
        }
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving settings'
      });
    }
  }

  /**
   * Get organization logo (public endpoint, no auth required)
   * GET /api/settings/public/logo
   */
  static async getOrganizationLogo(req, res) {
    try {
      const { company_id } = req.query;
      
      // Default to company ID 1 if not provided
      const companyId = company_id ? parseInt(company_id, 10) : 1;

      if (isNaN(companyId) || companyId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID'
        });
      }

      // Get organization name and logo from settings
      const organizationNameSetting = await SettingsService.getSetting(companyId, 'organization_name');
      const logoSetting = await SettingsService.getSetting(companyId, 'logo_url');

      const organizationName = organizationNameSetting?.setting_value || 'Organization';
      const logoUrl = logoSetting?.setting_value || null;

      res.status(200).json({
        success: true,
        message: 'Organization logo retrieved successfully',
        data: {
          organization_name: organizationName,
          logo_url: logoUrl
        }
      });
    } catch (error) {
      console.error('Get organization logo error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving organization logo'
      });
    }
  }

  /**
   * Update or create a setting (upsert)
   * PATCH /api/settings/:company_id/:setting_key
   */
  static async updateSetting(req, res) {
    try {
      const { company_id, setting_key } = req.params;
      const { setting_value } = req.body;

      // Parse company_id to integer
      const companyId = parseInt(company_id, 10);

      if (isNaN(companyId) || companyId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID'
        });
      }

      // Check if setting exists
      const existingSetting = await SettingsService.getSetting(companyId, setting_key);
      
      let result;
      if (!existingSetting) {
        // Create new setting if it doesn't exist
        result = await SettingsService.createSetting({
          company_id: companyId,
          setting_key,
          setting_value
        });
      } else {
        // Update existing setting
        result = await SettingsService.updateSetting(companyId, setting_key, {
          setting_value
        });
      }

      res.status(200).json({
        success: true,
        message: 'Setting saved successfully',
        data: result
      });
    } catch (error) {
      console.error('Update setting error:', error);
      
      if (error.message.includes('validation') || 
          error.message.includes('required') ||
          error.message.includes('Invalid') ||
          error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while saving setting'
      });
    }
  }
}

module.exports = SettingsController;
