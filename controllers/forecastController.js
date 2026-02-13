'use strict';

const forecastService = require('../services/forecastService');
const { User } = require('../model');
const activityTrack = require('../utils/activityTrack');

/**
 * Forecast Controller
 * Handles HTTP requests for demand forecasting operations
 */
class ForecastController {
  /**
   * Get user's company_id from the authenticated user
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
   * Generate demand forecast for products
   * GET /api/forecast
   */
  static async generateForecast(req, res) {
    try {
      const userId = req.user?.user_id;
      const {
        location_id,
        product_id,
        category_id,
        historical_days = 365,
        company_id
      } = req.query;

      // Get company_id from query, user, or error
      let finalCompanyId = company_id ? parseInt(company_id) : null;

      if (!finalCompanyId && userId) {
        finalCompanyId = await ForecastController.getUserCompanyId(userId);
      }

      if (!finalCompanyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required. Please provide company_id in query parameters or ensure your user account is associated with a company.'
        });
      }

      // Prepare parameters
      const params = {
        company_id: finalCompanyId,
        historical_days: parseInt(historical_days) || 365
      };

      if (location_id) params.location_id = parseInt(location_id);
      if (product_id) params.product_id = parseInt(product_id);
      if (category_id) params.category_id = parseInt(category_id);

      // Generate forecast
      let forecast = await forecastService.generateDemandForecast(params);

      if (forecast && forecast === 'string') {
        forecast = JSON.parse(forecast);
      }

      try {
        if (location_id) params.location_id = parseInt(location_id); 

        let forecast = await forecastService.generateDemandForecast(params);

        if (forecast && forecast === 'string') {
          forecast = JSON.parse(forecast);
        }

      } catch (error) {
        console.error('Generate forecast error:', error);
      }

      // Log activity (non-blocking)
      try {
        await activityTrack.viewed('forecast', null, {
          userId,
          description: `Demand forecast generated for company ${finalCompanyId}`
        });
      } catch (e) {
        // Non-blocking activity log
      }

      res.status(200).json({
        success: true,
        message: 'Demand forecast generated successfully',
        data: forecast
      });
    } catch (error) {
      console.error('Generate forecast error:', error);

      // Check for specific error types
      if (error.message.includes('Insufficient historical data')) {
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

      if (error.message.includes('API key not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while generating forecast',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get forecast for a specific product
   * GET /api/forecast/product/:productId
   */
  static async getProductForecast(req, res) {
    try {
      const userId = req.user?.user_id;
      const { productId } = req.params;
      const { location_id, company_id } = req.query;

      // Get company_id from query, user, or error
      let finalCompanyId = company_id ? parseInt(company_id) : null;

      if (!finalCompanyId && userId) {
        finalCompanyId = await ForecastController.getUserCompanyId(userId);
      }

      if (!finalCompanyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required. Please provide company_id in query parameters or ensure your user account is associated with a company.'
        });
      }

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      // Prepare parameters
      const params = {
        product_id: parseInt(productId),
        company_id: finalCompanyId
      };

      if (location_id) params.location_id = parseInt(location_id);

      // Get product forecast
      const forecast = await forecastService.getProductForecast(params);

      // Log activity (non-blocking)
      try {
        await activityTrack.viewed('forecast', productId, {
          userId,
          description: `Product forecast viewed for product ${productId}`
        });
      } catch (e) {
        // Non-blocking activity log
      }

      res.status(200).json({
        success: true,
        message: 'Product forecast retrieved successfully',
        data: forecast
      });
    } catch (error) {
      console.error('Get product forecast error:', error);

      if (error.message.includes('Insufficient data')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving product forecast',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }


}

module.exports = ForecastController;

