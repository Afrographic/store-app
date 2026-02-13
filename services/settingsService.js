'use strict';

const { Setting } = require('../model');
const { Op } = require('sequelize');

/**
 * Settings Service
 * Contains all business logic for settings operations
 */
class SettingsService {
  /**
   * Get all settings for a company
   * @param {number} companyId - Company ID
   * @returns {Promise<Array>} - Array of settings
   */
  static async getSettingsByCompany(companyId) {
    try {
      const settings = await Setting.findAll({
        where: { company_id: companyId },
        order: [['setting_key', 'ASC']]
      });

      return settings;
    } catch (error) {
      console.error('Error getting settings by company:', error);
      throw new Error('Failed to retrieve settings');
    }
  }

  /**
   * Get a specific setting by company and key
   * @param {number} companyId - Company ID
   * @param {string} settingKey - Setting key
   * @returns {Promise<Object|null>} - Setting object or null
   */
  static async getSetting(companyId, settingKey) {
    try {
      const setting = await Setting.findOne({
        where: {
          company_id: companyId,
          setting_key: settingKey.toLowerCase()
        }
      });

      return setting;
    } catch (error) {
      console.error('Error getting setting:', error);
      throw new Error('Failed to retrieve setting');
    }
  }

  /**
   * Create a new setting
   * @param {Object} settingData - Setting data
   * @returns {Promise<Object>} - Created setting
   */
  static async createSetting(settingData) {
    try {
      const { company_id, setting_key, setting_value } = settingData;

      // Validate required fields
      if (!company_id || !setting_key) {
        throw new Error('Company ID and setting key are required');
      }

      // Validate company_id is a positive integer
      if (!Number.isInteger(company_id) || company_id <= 0) {
        throw new Error('Company ID must be a positive integer');
      }

      // Validate setting_key
      if (typeof setting_key !== 'string' || setting_key.trim().length === 0) {
        throw new Error('Setting key must be a non-empty string');
      }

      if (setting_key.length > 100) {
        throw new Error('Setting key must be 100 characters or less');
      }

      // Check if setting already exists
      const existingSetting = await this.getSetting(company_id, setting_key);
      if (existingSetting) {
        throw new Error('Setting already exists for this company');
      }

      const setting = await Setting.create({
        company_id,
        setting_key: setting_key.toLowerCase().trim(),
        setting_value: setting_value || null
      });

      return setting;
    } catch (error) {
      console.error('Error creating setting:', error);
      throw error;
    }
  }

  /**
   * Update an existing setting
   * @param {number} companyId - Company ID
   * @param {string} settingKey - Setting key
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated setting
   */
  static async updateSetting(companyId, settingKey, updateData) {
    try {
      const { setting_value } = updateData;

      // Find the setting
      const setting = await Setting.findOne({
        where: {
          company_id: companyId,
          setting_key: settingKey.toLowerCase()
        }
      });

      if (!setting) {
        throw new Error('Setting not found');
      }

      // Update the setting
      await setting.update({
        setting_value: setting_value !== undefined ? setting_value : setting.setting_value
      });

      return setting;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  /**
   * Bulk update settings for a company
   * @param {number} companyId - Company ID
   * @param {Array} settingsArray - Array of settings to update
   * @returns {Promise<Array>} - Updated settings
   */
  static async bulkUpdateSettings(companyId, settingsArray) {
    try {
      const results = [];

      for (const settingData of settingsArray) {
        const { setting_key, setting_value } = settingData;

        if (!setting_key) {
          throw new Error('Setting key is required for all settings');
        }

        // Check if setting exists
        const existingSetting = await this.getSetting(companyId, setting_key);
        
        if (existingSetting) {
          // Update existing setting
          const updatedSetting = await this.updateSetting(companyId, setting_key, {
            setting_value
          });
          results.push(updatedSetting);
        } else {
          // Create new setting
          const newSetting = await this.createSetting({
            company_id: companyId,
            setting_key,
            setting_value
          });
          results.push(newSetting);
        }
      }

      return results;
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      throw error;
    }
  }

  /**
   * Delete a setting
   * @param {number} companyId - Company ID
   * @param {string} settingKey - Setting key
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteSetting(companyId, settingKey) {
    try {
      const setting = await Setting.findOne({
        where: {
          company_id: companyId,
          setting_key: settingKey.toLowerCase()
        }
      });

      if (!setting) {
        throw new Error('Setting not found');
      }

      await setting.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  }

  /**
   * Get settings with pagination
   * @param {number} companyId - Company ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} - Paginated settings
   */
  static async getSettingsWithPagination(companyId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sort = 'setting_key',
        order = 'ASC'
      } = options;

      const offset = (page - 1) * limit;

      // Build where clause for search
      const whereClause = { company_id: companyId };
      if (search) {
        whereClause[Op.or] = [
          { setting_key: { [Op.like]: `%${search}%` } },
          { setting_value: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: settings } = await Setting.findAndCountAll({
        where: whereClause,
        order: [[sort, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      return {
        settings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting settings with pagination:', error);
      throw new Error('Failed to retrieve settings');
    }
  }

  /**
   * Get setting value as specific type
   * @param {number} companyId - Company ID
   * @param {string} settingKey - Setting key
   * @returns {Promise<any>} - Parsed setting value
   */
  static async getSettingValue(companyId, settingKey) {
    try {
      const setting = await this.getSetting(companyId, settingKey);
      
      if (!setting) {
        return null;
      }

      return setting.getValueAsType();
    } catch (error) {
      console.error('Error getting setting value:', error);
      throw error;
    }
  }
}

module.exports = SettingsService;
