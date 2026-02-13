const reservedQuantityService = require('../services/reservedQuantityService');
const { sequelize } = require('../model');

/**
 * Get reserved quantities with optional filters
 * GET /api/reserved-quantities
 */
const getReservedQuantities = async (req, res) => {
  try {
    const { product_id, location_id, include_all } = req.query;
    
    const filters = {};
    if (product_id) filters.product_id = parseInt(product_id);
    if (location_id) filters.location_id = parseInt(location_id);
    if (include_all === 'true' || include_all === true) filters.include_all = true;
    
    const result = await reservedQuantityService.getReservedQuantities(filters);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error fetching reserved quantities:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reserved quantities',
      error: error.message
    });
  }
};

/**
 * Store/Update reserved quantities for multiple product-location combinations
 * PUT /api/reserved-quantities
 */
const storeReservedQuantities = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { reserved_quantities } = req.body;
    
    // Validate request body
    if (!reserved_quantities || !Array.isArray(reserved_quantities)) {
      return res.status(400).json({
        success: false,
        message: 'reserved_quantities array is required'
      });
    }
    
    // Validate each item in the array
    for (const item of reserved_quantities) {
      if (!item.product_id || !item.location_id || item.quantity === undefined || item.quantity === null) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Each item must have product_id, location_id, and quantity'
        });
      }
      
      if (parseFloat(item.quantity) < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Reserved quantity cannot be negative'
        });
      }
    }
    
    // Store/Update reserved quantities
    const result = await reservedQuantityService.updateReservedQuantities(
      reserved_quantities,
      transaction
    );
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Reserved quantities stored successfully',
      data: result.data
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error storing reserved quantities:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to store reserved quantities',
      error: error.message
    });
  }
};

module.exports = {
  getReservedQuantities,
  storeReservedQuantities
};
