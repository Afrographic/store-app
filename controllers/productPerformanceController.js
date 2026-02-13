'use strict';

const productPerformanceService = require('../services/productPerformanceService');
const { User } = require('../model');
const activityTrack = require('../utils/activityTrack');

/**
 * Product Performance Controller
 * Handles HTTP requests for product performance analysis
 */
class ProductPerformanceController {
  /**
   * Get user's company_id
   */
  static async getUserCompanyId(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['user_id', 'company_id']
      });
      return user?.company_id || null;
    } catch (error) {
      console.error('Error fetching user company:', error);
      return null;
    }
  }

  /**
   * Generate product performance analysis
   * GET /api/product-performance
   */
  static async generateAnalysis(req, res) {
    try {
      const userId = req.user?.user_id;
      const {
        location_id,
        category_id,
        historical_days = 365,
        company_id
      } = req.query;

      let finalCompanyId = company_id ? parseInt(company_id) : null;

      if (!finalCompanyId && userId) {
        finalCompanyId = await ProductPerformanceController.getUserCompanyId(userId);
      }

      if (!finalCompanyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required.'
        });
      }

      const params = {
        company_id: finalCompanyId,
        historical_days: parseInt(historical_days) || 365
      };

      if (location_id) params.location_id = parseInt(location_id);
      if (category_id) params.category_id = parseInt(category_id);

      let analysis = await productPerformanceService.generateProductPerformanceAnalysis(params);
      if (analysis && typeof analysis === 'string') {
        try {
          analysis = JSON.parse(analysis);
        } catch (e) {
          console.error('Failed to parse product performance analysis JSON:', e);
        }
      }

      try {
        await activityTrack.viewed('product_performance', null, {
          userId,
          description: `Product performance analysis generated for company ${finalCompanyId}`
        });
      } catch (e) {
        // Non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Product performance analysis generated successfully',
        data: analysis
      });
    } catch (error) {
      console.error('Generate analysis error:', error);

      if (error.message.includes('Insufficient performance data') || 
          error.message.includes('Company ID is required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('OpenAI') || error.message.includes('open_ai_api_key')) {
        return res.status(400).json({
          success: false,
          message: error.message.includes('not found') 
            ? error.message 
            : 'Error connecting to AI service. Please check your OpenAI API key configuration.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while generating analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = ProductPerformanceController;

