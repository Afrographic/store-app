'use strict';

const { StockMovement, Inventory, Product, Location } = require('../model');
const { Op } = require('sequelize');
const sequelize = require('../model').sequelize;

const normalizeReferenceType = (type) => {
  if (!type) {
    return type;
  }

  switch (type) {
    case 'ORDER_PURCHASE':
      // Use ORDER_PURCHASE directly to match DB enum and inventory logic
      return 'ORDER_PURCHASE';
    case 'ORDER_SELL':
      return 'POS_SALE';
    default:
      return type;
  }
};

/**
 * Stock Movement Service
 * Handles business logic for stock movements and inventory updates
 */

/**
 * Get all stock movements with pagination and filters
 */
const list = async (queryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      product_id,
      location_id,
      movement_type,
      reference_type
    } = queryParams;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (product_id) where.product_id = product_id;
    if (location_id) where.location_id = location_id;
    if (movement_type) where.movement_type = movement_type;
    if (reference_type) where.reference_type = reference_type;

    const { count, rows } = await StockMovement.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
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
      ]
    });

    const formattedRows = rows.map((row) => {
      const record = row.toJSON ? row.toJSON() : row;
      record.reference_type = normalizeReferenceType(record.reference_type);
      return record;
    });

    return {
      data: formattedRows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    throw new Error(`Error fetching stock movements: ${error.message}`);
  }
};

/**
 * Create stock movement and update inventory
 */
const create = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      product_id,
      location_id,
      quantity,
      movement_type,
      reference_type,
      reference_id,
      created_by
    } = data;

    const normalizedReferenceType = normalizeReferenceType(reference_type);

    // Validate quantity
    if (!quantity || parseFloat(quantity) <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Create stock movement record
    const stockMovement = await StockMovement.create({
      product_id,
      location_id,
      quantity: parseFloat(quantity),
      movement_type,
      reference_type: normalizedReferenceType || null,
      reference_id: reference_id || null,
      created_by: created_by || null
    }, { transaction });

    // Handle inventory updates based on reference_type and movement_type
    await updateInventory({
      product_id,
      location_id,
      quantity: parseFloat(quantity),
      movement_type,
      reference_type: normalizedReferenceType,
      transaction
    });

    await transaction.commit();

    // Fetch the created record with associations
    const result = await StockMovement.findByPk(stockMovement.movement_id, {
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
      ]
    });

    if (result) {
      result.setDataValue('reference_type', normalizeReferenceType(result.reference_type));
    }

    return result;
  } catch (error) {
    await transaction.rollback();
    throw new Error(`Error creating stock movement: ${error.message}`);
  }
};

/**
 * Update inventory based on movement type and reference type
 */
const updateInventory = async ({ product_id, location_id, quantity, movement_type, reference_type, transaction }) => {
  try {
    const normalizedReferenceType = normalizeReferenceType(reference_type);

    // Find existing inventory record
    let inventory = await Inventory.findOne({
      where: { product_id, location_id },
      transaction
    });

    // Calculate new quantity based on movement type
    let newQuantity = 0;

    if (normalizedReferenceType === 'OPENING_STOCK' && movement_type === 'IN') {
      // For opening stock, set the quantity directly
      if (inventory) {
        newQuantity = parseFloat(inventory.quantity) + parseFloat(quantity);
      } else {
        newQuantity = parseFloat(quantity);
      }
    } else if ((normalizedReferenceType === 'POS_RETURN' || normalizedReferenceType === 'ORDER_PURCHASE') && movement_type === 'IN') {
      // For POS returns and purchase orders, add quantity to inventory
      newQuantity = inventory ? parseFloat(inventory.quantity) + parseFloat(quantity) : parseFloat(quantity);
    } else if (normalizedReferenceType === 'POS_SALE' && movement_type === 'OUT') {
      // For POS sales (or legacy sell orders), subtract quantity from inventory
      if (!inventory) {
        throw new Error('Cannot perform OUT movement: No inventory record exists for this product at this location');
      }
      
      // Check for sufficient inventory before subtraction
      const currentQuantity = parseFloat(inventory.quantity);
      const requestedQuantity = parseFloat(quantity);
      
      if (requestedQuantity > currentQuantity) {
        throw new Error(`Quantity is not available. Available quantity: ${currentQuantity}`);
      }
      
      newQuantity = currentQuantity - requestedQuantity;
    } else if (normalizedReferenceType === 'ADJUSTMENT' || normalizedReferenceType === 'TRANSFER') {
      if (movement_type === 'IN') {
        // Add quantity to inventory
        newQuantity = inventory ? parseFloat(inventory.quantity) + parseFloat(quantity) : parseFloat(quantity);
      } else if (movement_type === 'OUT') {
        // Subtract quantity from inventory
        if (!inventory) {
          throw new Error('Cannot perform OUT movement: No inventory record exists for this product at this location');
        }
        
        // Check for sufficient inventory before subtraction
        const currentQuantity = parseFloat(inventory.quantity);
        const requestedQuantity = parseFloat(quantity);
        
        if (requestedQuantity > currentQuantity) {
          throw new Error(`Quantity is not available. Available quantity: ${currentQuantity}`);
        }
        
        newQuantity = currentQuantity - requestedQuantity;
      }
    } else {
      throw new Error(`Invalid reference_type: ${reference_type}`);
    }

    // Update or create inventory record
    if (inventory) {
      await inventory.update({
        quantity: newQuantity,
        last_updated: new Date()
      }, { transaction });
    } else {
      await Inventory.create({
        product_id,
        location_id,
        quantity: newQuantity,
        reserved_quantity: 0,
        last_updated: new Date()
      }, { transaction });
    }

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Get inventory quantity for a product at a location
 */
const getInventoryQuantity = async (product_id, location_id) => {
  try {
    const inventory = await Inventory.findOne({
      where: { product_id, location_id },
      attributes: ['quantity']
    });

    return inventory ? parseFloat(inventory.quantity) : 0;
  } catch (error) {
    throw new Error(`Error fetching inventory: ${error.message}`);
  }
};

module.exports = {
  list,
  create,
  updateInventory,
  getInventoryQuantity
};

