'use strict';

const priceOptimizationService = require('../services/priceOptimizationService');
const { User } = require('../model');
const activityTrack = require('../utils/activityTrack');

class PriceOptimizationController {
  static async getUserCompanyId(userId) {
    try {
      const user = await User.findByPk(userId, { attributes: ['user_id', 'company_id'] });
      return user?.company_id || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * GET /api/price-optimization
   */
  static async generateRecommendations(req, res) {
    try {
      const userId = req.user?.user_id;
      const { location_id, product_id, category_id, company_id } = req.query;

      let finalCompanyId = company_id ? parseInt(company_id) : null;
      if (!finalCompanyId && userId) finalCompanyId = await PriceOptimizationController.getUserCompanyId(userId);
      if (!finalCompanyId) {
        return res.status(400).json({ success: false, message: 'Company ID is required. Provide company_id or associate your user with a company.' });
      }

      const params = { company_id: finalCompanyId };
      if (location_id) params.location_id = parseInt(location_id);
      if (product_id) params.product_id = parseInt(product_id);
      if (category_id) params.category_id = parseInt(category_id);

      let result = await priceOptimizationService.generatePriceOptimization(params);
      if (result && typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch (e) {
          console.error('Failed to parse price optimization JSON:', e);
        }
      }

      try {
        await activityTrack.viewed('price_optimization', null, { userId, description: `Price optimization generated for company ${finalCompanyId}` });
      } catch (_) {}

      return res.status(200).json({ success: true, message: 'Price optimization generated successfully', data: result });
    } catch (error) {
      if (error.message.includes('Company ID is required')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.message.includes('Insufficient historical data')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.message.includes('OpenAI') || error.message.includes('API')) {
        return res.status(400).json({ success: false, message: 'Error connecting to AI service. Check OpenAI API key in settings.' });
      }
      console.log({error})
      return res.status(500).json({ success: false, message: 'Internal server error while generating price optimization' });
    }
  }

  /**
   * GET /api/price-optimization/product/:productId
   */
  static async getProductRecommendation(req, res) {
    try {
      const userId = req.user?.user_id;
      const { productId } = req.params;
      const { location_id, company_id } = req.query;

      let finalCompanyId = company_id ? parseInt(company_id) : null;
      if (!finalCompanyId && userId) finalCompanyId = await PriceOptimizationController.getUserCompanyId(userId);
      if (!finalCompanyId) return res.status(400).json({ success: false, message: 'Company ID is required.' });
      if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

      const params = { company_id: finalCompanyId, product_id: parseInt(productId) };
      if (location_id) params.location_id = parseInt(location_id);

      let result = await priceOptimizationService.getProductRecommendation(params);
      if (result && typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch (e) {
          console.error('Failed to parse product price recommendation JSON:', e);
        }
      }

      try {
        await activityTrack.viewed('price_optimization_product', productId, { userId, description: `Price recommendation viewed for product ${productId}` });
      } catch (_) {}

      return res.status(200).json({ success: true, message: 'Product price recommendation retrieved successfully', data: result });
    } catch (error) {
      if (error.message.includes('Insufficient data')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error while retrieving price recommendation' });
    }
  }
}

module.exports = PriceOptimizationController;


