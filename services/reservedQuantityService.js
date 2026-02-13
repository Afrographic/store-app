const { Inventory, Product, Location } = require('../model');
const { Op } = require('sequelize');

class ReservedQuantityService {
  /**
   * Update reserved quantities for multiple product-location combinations
   * @param {Array} reservedQuantities - Array of {product_id, location_id, quantity}
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} - Result with success status and data
   */
  /**
   * Get reserved quantities with optional filters
   * @param {Object} filters - Optional filters {product_id, location_id}
   * @returns {Promise<Object>} - Result with reserved quantities data
   */
  async getReservedQuantities(filters = {}) {
    try {
      const where = {};
      
      // Add filters if provided
      if (filters.product_id) {
        where.product_id = filters.product_id;
      }
      
      if (filters.location_id) {
        where.location_id = filters.location_id;
      }
      
      // If include_all is true, return all inventory records (not just those with reserved_quantity > 0)
      // Otherwise, only get records where reserved_quantity is greater than 0
      if (!filters.include_all) {
        where.reserved_quantity = {
          [Op.gt]: 0
        };
      }
      
      // Fetch inventory records with reserved quantities
      const inventories = await Inventory.findAll({
        where,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_id', 'name', 'sku']
          },
          {
            model: Location,
            as: 'location',
            attributes: ['location_id', 'name']
          }
        ],
        order: [
          ['product_id', 'ASC'],
          ['location_id', 'ASC']
        ]
      });
      
      // Format the response
      const formattedData = inventories.map(inv => {
        const quantity = parseFloat(inv.quantity || 0);
        const reservedQuantity = parseFloat(inv.reserved_quantity || 0);
        const availableQuantity = Math.max(0, quantity - reservedQuantity);
        
        return {
          inventory_id: inv.inventory_id,
          product_id: inv.product_id,
          location_id: inv.location_id,
          quantity: quantity,
          reserved_quantity: reservedQuantity,
          available_quantity: availableQuantity,
          product: inv.product ? {
            name: inv.product.name,
            sku: inv.product.sku
          } : null,
          location: inv.location ? {
            name: inv.location.name
          } : null,
          last_updated: inv.last_updated
        };
      });
      
      return {
        success: true,
        message: 'Reserved quantities retrieved successfully',
        data: formattedData
      };
    } catch (error) {
      console.error('Error fetching reserved quantities:', error);
      throw error;
    }
  }

  async updateReservedQuantities(reservedQuantities, transaction = null) {
    try {
      const results = [];
      
      for (const item of reservedQuantities) {
        const { product_id, location_id, quantity } = item;
        
        // Validate required fields
        if (!product_id || !location_id || quantity === undefined || quantity === null) {
          throw new Error(`Missing required fields for product_id: ${product_id}, location_id: ${location_id}`);
        }
        
        // Validate quantity is not negative
        if (parseFloat(quantity) < 0) {
          throw new Error(`Reserved quantity cannot be negative for product_id: ${product_id}, location_id: ${location_id}`);
        }
        
        // Find or create inventory record
        const [inventory, created] = await Inventory.findOrCreate({
          where: {
            product_id: product_id,
            location_id: location_id
          },
          defaults: {
            product_id: product_id,
            location_id: location_id,
            quantity: 0,
            reserved_quantity: parseFloat(quantity)
          },
          transaction
        });
        
        // If record already exists, update the reserved_quantity
        if (!created) {
          await inventory.update({
            reserved_quantity: parseFloat(quantity)
          }, { transaction });
        }
        
        results.push({
          product_id,
          location_id,
          reserved_quantity: parseFloat(quantity),
          created: created
        });
      }
      
      return {
        success: true,
        message: 'Reserved quantities updated successfully',
        data: results
      };
    } catch (error) {
      console.error('Error updating reserved quantities:', error);
      throw error;
    }
  }
  
}

module.exports = new ReservedQuantityService();
