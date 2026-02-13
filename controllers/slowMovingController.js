'use strict';

const slowMovingService = require('../services/slowMovingService');
const { User } = require('../model');
const activityTrack = require('../utils/activityTrack');

class SlowMovingController {
  static async getUserCompanyId(userId) {
    try {
      const user = await User.findByPk(userId, { attributes: ['user_id', 'company_id'] });
      return user?.company_id || null;
    } catch (e) {
      return null;
    }
  }

  // GET /api/slow-moving
  static async getAlerts(req, res) {
    try {
      const userId = req.user?.user_id;
      const {
        location_id,
        product_id,
        category_id,
        analysis_days = 180,
        company_id,
        threshold_days_of_inventory,
        threshold_days_since_sale
      } = req.query;

      let finalCompanyId = company_id ? parseInt(company_id) : null;
      if (!finalCompanyId && userId) {
        finalCompanyId = await SlowMovingController.getUserCompanyId(userId);
      }
      if (!finalCompanyId) {
        return res.status(400).json({ success: false, message: 'Company ID is required.' });
      }

      const params = {
        company_id: finalCompanyId,
        analysis_days: parseInt(analysis_days) || 180
      };
      if (location_id) params.location_id = parseInt(location_id);
      if (product_id) params.product_id = parseInt(product_id);
      if (category_id) params.category_id = parseInt(category_id);
      if (threshold_days_of_inventory) params.threshold_days_of_inventory = parseInt(threshold_days_of_inventory);
      if (threshold_days_since_sale) params.threshold_days_since_sale = parseInt(threshold_days_since_sale);

      let data = await slowMovingService.generateSlowMovingAlerts(params);
      if (data && typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse slow-moving alerts JSON:', e);
        }
      }

      try {
        await activityTrack.viewed('slow_moving', null, { userId, description: `Slow-moving alerts generated for company ${finalCompanyId}` });
      } catch {}

      return res.status(200).json({ success: true, message: 'Slow-moving alerts generated successfully', data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to generate slow-moving alerts', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
  }
}

module.exports = SlowMovingController;


