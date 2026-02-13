'use strict';

const stockoutImpactService = require('../services/stockoutImpactService');
const { User } = require('../model');
const activityTrack = require('../utils/activityTrack');

/**
 * Stock-Out Impact Analysis Controller
 */
class StockoutImpactController {
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
   * Generate stockout impact analysis
   * GET /api/stockout-impact
   */
  static async generateAnalysis(req, res) {
    try {
      const userId = req.user?.user_id;
      const { location_id, product_id, category_id, analysis_days = 90, company_id } = req.query;

      let finalCompanyId = company_id ? parseInt(company_id) : null;

      if (!finalCompanyId && userId) {
        finalCompanyId = await StockoutImpactController.getUserCompanyId(userId);
      }

      if (!finalCompanyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required. Please provide company_id in query parameters or ensure your user account is associated with a company.'
        });
      }

      const params = {
        company_id: finalCompanyId,
        analysis_days: parseInt(analysis_days) || 90
      };

      if (location_id) params.location_id = parseInt(location_id);
      if (product_id) params.product_id = parseInt(product_id);
      if (category_id) params.category_id = parseInt(category_id);

      let analysis = await stockoutImpactService.generateImpactAnalysis(params);
      if (analysis && typeof analysis === 'string') {
        try {
          analysis = JSON.parse(analysis);
        } catch (e) {
          console.error('Failed to parse stockout impact analysis JSON:', e);
        }
      }

      // Log activity (non-blocking)
      try {
        await activityTrack.viewed('stockout_impact', null, {
          userId,
          description: `Stockout impact analysis generated for company ${finalCompanyId}`
        });
      } catch (e) {
        // Non-blocking activity log
      }

      res.status(200).json({
        success: true,
        message: 'Stockout impact analysis generated successfully',
        data: analysis
      });
    } catch (error) {
      console.error('Generate analysis error:', error);

      if (error.message.includes('Insufficient data')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Company ID is required')) {
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
            : 'Error connecting to AI service. Please check your OpenAI API key configuration in settings.',
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

module.exports = StockoutImpactController;

