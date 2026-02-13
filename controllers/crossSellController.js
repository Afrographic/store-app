'use strict';

const crossSellService = require('../services/crossSellService');
const { User } = require('../model');
const activityTrack = require('../utils/activityTrack');

class CrossSellController {
  static async getUserCompanyId(userId) {
    try {
      const user = await User.findByPk(userId, { attributes: ['user_id', 'company_id'] });
      return user?.company_id || null;
    } catch (error) {
      console.error('Error fetching user company:', error);
      return null;
    }
  }

  /**
   * GET /api/cross-sell
   */
  static async generate(req, res) {
    try {
      const userId = req.user?.user_id;
      const {
        location_id,
        product_id,
        category_id,
        historical_days = 365,
        company_id = 1,
      } = req.query;

      let finalCompanyId = company_id ? parseInt(company_id) : null;
      if (!finalCompanyId && userId) {
        finalCompanyId = await CrossSellController.getUserCompanyId(userId);
      }
      if (!finalCompanyId) {
        return res.status(400).json({ success: false, message: 'Company ID is required.' });
      }

      const params = { company_id: finalCompanyId, historical_days: parseInt(historical_days) || 365 };
      if (location_id) params.location_id = parseInt(location_id);
      if (product_id) params.product_id = parseInt(product_id);
      if (category_id) params.category_id = parseInt(category_id);

      let analysis = await crossSellService.generateCrossSell(params);
      if (analysis && typeof analysis === 'string') {
        try {
          analysis = JSON.parse(analysis);
        } catch (e) {
          console.error('Failed to parse cross-sell analysis JSON:', e);
        }
      }

      try {
        await activityTrack.viewed('cross_sell', null, {
          userId,
          description: `Cross-sell analysis generated for company ${finalCompanyId}`
        });
      } catch (e) {}

      res.status(200).json({ success: true, message: 'Cross-sell analysis generated successfully', data: analysis });
    } catch (error) {
      console.error('Generate cross-sell error:', error);
      if (error.message.includes('Insufficient') || error.message.includes('Company ID is required')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.message.includes('OpenAI') || error.message.includes('open_ai_api_key')) {
        return res.status(400).json({
          success: false,
          message: error.message.includes('not found') ? error.message : 'Error connecting to AI service. Check OpenAI API key.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      res.status(500).json({ success: false, message: 'Internal server error while generating cross-sell analysis', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
  }

  /**
   * GET /api/cross-sell/product/:productId
   */
  static async getProduct(req, res) {
    try {
      const userId = req.user?.user_id;
      const { productId } = req.params;
      const { location_id, company_id } = req.query;

      let finalCompanyId = company_id ? parseInt(company_id) : null;
      if (!finalCompanyId && userId) {
        finalCompanyId = await CrossSellController.getUserCompanyId(userId);
      }
      if (!finalCompanyId) {
        return res.status(400).json({ success: false, message: 'Company ID is required.' });
      }
      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
      }

      const params = { product_id: parseInt(productId), company_id: finalCompanyId };
      if (location_id) params.location_id = parseInt(location_id);

      let analysis = await crossSellService.getProductCrossSell(params);
      if (analysis && typeof analysis === 'string') {
        try {
          analysis = JSON.parse(analysis);
        } catch (e) {
          console.error('Failed to parse cross-sell product analysis JSON:', e);
        }
      }

      try {
        await activityTrack.viewed('cross_sell_product', productId, {
          userId,
          description: `Cross-sell viewed for product ${productId}`
        });
      } catch (e) {}

      res.status(200).json({ success: true, message: 'Cross-sell suggestions retrieved successfully', data: analysis });
    } catch (error) {
      console.error('Get product cross-sell error:', error);
      if (error.message.includes('Insufficient') || error.message.includes('required')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Internal server error while retrieving cross-sell suggestions', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
  }
}

module.exports = CrossSellController;


