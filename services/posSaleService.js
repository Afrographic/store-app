'use strict';

const { PosSale, PosSaleItem, Product, Client, Location, Company, PosTerminal, PaymentMethod, User, Inventory, StockMovement } = require('../model');
const { Op } = require('sequelize');
const sequelize = require('../model').sequelize;
const { PAGINATION } = require('../utils/constants');

/**
 * POS Sale Service
 * Handles business logic for POS sales and sale items
 * Manages both PosSale and PosSaleItem tables together
 */

/**
 * Generate unique invoice number
 */
const generateInvoiceNumber = async (companyId) => {
  const prefix = 'POS';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Get the last invoice number for today
  const lastSale = await PosSale.findOne({
    where: {
      company_id: companyId,
      invoice_number: {
        [Op.like]: `${prefix}-${dateStr}-%`
      }
    },
    order: [['sale_id', 'DESC']]
  });

  let sequence = 1;
  if (lastSale && lastSale.invoice_number) {
    const lastSeq = parseInt(lastSale.invoice_number.split('-').pop());
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}-${dateStr}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Get all POS sales with pagination and filters
 */
const list = async (queryParams) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      company_id,
      location_id,
      terminal_id,
      client_id,
      cashier_id,
      payment_status,
      status,
      from_date,
      to_date,
      search
    } = queryParams;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (company_id) where.company_id = company_id;
    if (location_id) where.location_id = location_id;
    if (terminal_id) where.terminal_id = terminal_id;
    if (client_id) where.client_id = client_id;
    if (cashier_id) where.cashier_id = cashier_id;
    if (payment_status) where.payment_status = payment_status;
    if (status) where.status = status;

    // Search by invoice number
    if (search) {
      where.invoice_number = {
        [Op.like]: `%${search}%`
      };
    }

    // Date range filter
    if (from_date || to_date) {
      where.sale_date = {};
      if (from_date) where.sale_date[Op.gte] = from_date;
      if (to_date) where.sale_date[Op.lte] = to_date;
    }

    // Count sales separately to avoid inflation from joins
    const totalCount = await PosSale.count({
      where,
      distinct: true,
      col: 'sale_id'
    });

    // Fetch sales with pagination
    const rows = await PosSale.findAll({
      where,
      limit: Math.min(parseInt(limit), PAGINATION.MAX_LIMIT),
      offset: parseInt(offset),
      order: [['sale_id', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['company_id', 'name']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['location_id', 'name', 'address']
        },
        {
          model: PosTerminal,
          as: 'terminal',
          attributes: ['terminal_id', 'terminal_name'],
          required: false
        },
        {
          model: Client,
          as: 'client',
          attributes: ['client_id', 'name', 'contact_name', 'email', 'phone'],
          required: false
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['user_id', 'username', 'full_name', 'email']
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['payment_method_id', 'name', 'type']
        },
        {
          model: PosSaleItem,
          as: 'saleItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['product_id', 'name', 'sku', 'unit', 'image']
            }
          ]
        }
      ]
    });

    return {
      data: rows.map(row => row.toJSON()),
      pagination: {
        total: parseInt(totalCount),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(totalCount) / parseInt(limit)),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: parseInt(totalCount)
      }
    };
  } catch (error) {
    throw new Error(`Error fetching POS sales: ${error.message}`);
  }
};

/**
 * Get single POS sale by ID with all details
 */
const getById = async (saleId) => {
  try {
    const sale = await PosSale.findByPk(saleId, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['company_id', 'name']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['location_id', 'name', 'address']
        },
        {
          model: PosTerminal,
          as: 'terminal',
          attributes: ['terminal_id', 'terminal_name'],
          required: false
        },
        {
          model: Client,
          as: 'client',
          attributes: ['client_id', 'name', 'contact_name', 'email', 'phone'],
          required: false
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['user_id', 'username', 'full_name', 'email']
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['payment_method_id', 'name', 'type']
        },
          {
            model: PosSaleItem,
            as: 'saleItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['product_id', 'name', 'sku', 'unit', 'description', 'image']
              }
            ]
          }
      ]
    });

    if (!sale) {
      throw new Error('POS sale not found');
    }

    return sale.toJSON();
  } catch (error) {
    throw new Error(`Error fetching POS sale: ${error.message}`);
  }
};

/**
 * Create new POS sale with sale items
 */
const create = async (data, userId = null) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      company_id,
      location_id,
      terminal_id,
      client_id,
      cashier_id,
      sale_date,
      subtotal,
      discount = 0,
      tax = 0,
      total_amount,
      payment_method_id,
      payment_status = 'PAID',
      status = 'COMPLETED',
      notes,
      saleItems = []
    } = data;

    // Validation
    if (!company_id) {
      throw new Error('Company ID is required');
    }

    if (!location_id) {
      throw new Error('Location ID is required');
    }

    if (!cashier_id) {
      throw new Error('Cashier ID is required');
    }

    if (!payment_method_id) {
      throw new Error('Payment method ID is required');
    }

    if (!saleItems || saleItems.length === 0) {
      throw new Error('At least one sale item is required');
    }

    // Validate sale items
    for (const item of saleItems) {
      if (!item.product_id) {
        throw new Error('Product ID is required for all sale items');
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        throw new Error('Quantity must be greater than 0 for all sale items');
      }
      if (!item.unit_price || parseFloat(item.unit_price) < 0) {
        throw new Error('Unit price must be 0 or greater for all sale items');
      }
    }

    const normalizedSaleItems = saleItems.map(item => {
      const quantity = parseFloat(item.quantity);
      const unit_price = parseFloat(item.unit_price);
      const discount = parseFloat(item.discount || 0);
      const tax = parseFloat(item.tax || 0);

      return {
        product_id: item.product_id,
        quantity,
        unit_price,
        discount,
        tax
      };
    });

    const locationIdNumber = Number(location_id);
    if (!Number.isFinite(locationIdNumber)) {
      throw new Error('Invalid location provided for sale');
    }

    if (status === 'COMPLETED') {
      const productIds = [...new Set(normalizedSaleItems.map(item => item.product_id))];

      const inventoryQueryOptions = {
        where: {
          product_id: { [Op.in]: productIds },
          location_id: locationIdNumber
        },
        transaction
      };

      if (transaction.LOCK && transaction.LOCK.UPDATE) {
        inventoryQueryOptions.lock = transaction.LOCK.UPDATE;
      }

      const inventoryRecords = await Inventory.findAll(inventoryQueryOptions);
      const inventoryMap = new Map(inventoryRecords.map(record => [record.product_id, record]));

      const productsInfo = await Product.findAll({
        where: { product_id: { [Op.in]: productIds } },
        attributes: ['product_id', 'name'],
        transaction
      });
      const productNameMap = new Map(productsInfo.map(product => [product.product_id, product.name]));

      for (const item of normalizedSaleItems) {
        const inventoryRecord = inventoryMap.get(item.product_id);
        const availableQuantity = inventoryRecord && inventoryRecord.quantity !== undefined
          ? parseFloat(inventoryRecord.quantity)
          : 0;

        if (!inventoryRecord || availableQuantity < item.quantity) {
          const productName = productNameMap.get(item.product_id) || `Product ID ${item.product_id}`;
          throw new Error(`Insufficient stock for ${productName}. Available quantity: ${availableQuantity}`);
        }
      }
    }

    // Generate invoice number
    const invoice_number = await generateInvoiceNumber(company_id);

    // Create POS sale
    const sale = await PosSale.create({
      company_id,
      location_id,
      terminal_id: terminal_id || null,
      client_id: client_id || null,
      cashier_id,
      invoice_number,
      sale_date: sale_date || new Date(),
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      total_amount: parseFloat(total_amount) || 0,
      payment_method_id,
      payment_status,
      status,
      notes: notes || null
    }, { transaction });

    // Create sale items
    const saleItemsData = normalizedSaleItems.map(item => {
      const line_total = (item.quantity * item.unit_price) - item.discount + item.tax;
      
      return {
        sale_id: sale.sale_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax: item.tax,
        line_total: line_total
      };
    });

    await PosSaleItem.bulkCreate(saleItemsData, { transaction });

    // If status is COMPLETED and payment_status is PAID, update inventory and create stock movements
    if (status === 'COMPLETED' && payment_status === 'PAID') {
      for (const item of saleItemsData) {
        // Check if inventory exists for this product and location
        const inventory = await Inventory.findOne({
          where: {
            product_id: item.product_id,
            location_id: location_id
          },
          transaction
        });

        if (inventory) {
          // Update inventory quantity (decrease stock)
          const newQuantity = parseFloat(inventory.quantity) - item.quantity;
          await inventory.update({
            quantity: Math.max(0, newQuantity) // Ensure quantity doesn't go negative
          }, { transaction });
        }

        // Create stock movement for tracking
        await StockMovement.create({
          product_id: item.product_id,
          location_id: location_id,
          quantity: parseFloat(item.quantity),
          movement_type: 'OUT',
          reference_type: 'POS_SALE',
          reference_id: sale.sale_id,
          created_by: userId
        }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch the created sale with all associations
    const createdSale = await getById(sale.sale_id);
    return createdSale;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Update existing POS sale
 */
const update = async (saleId, data, userId = null) => {
  const transaction = await sequelize.transaction();

  try {
    const sale = await PosSale.findByPk(saleId, { transaction });
    if (!sale) {
      throw new Error('POS sale not found');
    }

    // Check if sale can be updated (only if status is not CANCELLED or if reverting cancellation)
    if (sale.status === 'CANCELLED' && data.status !== 'COMPLETED') {
      throw new Error('Cannot update a cancelled sale');
    }

    const {
      location_id,
      terminal_id,
      client_id,
      sale_date,
      subtotal,
      discount,
      tax,
      total_amount,
      payment_method_id,
      payment_status,
      status,
      notes,
      saleItems
    } = data;

    // Update sale fields
    const updateData = {};
    if (location_id !== undefined) updateData.location_id = location_id;
    if (terminal_id !== undefined) updateData.terminal_id = terminal_id;
    if (client_id !== undefined) updateData.client_id = client_id;
    if (sale_date !== undefined) updateData.sale_date = sale_date;
    if (subtotal !== undefined) updateData.subtotal = parseFloat(subtotal);
    if (discount !== undefined) updateData.discount = parseFloat(discount);
    if (tax !== undefined) updateData.tax = parseFloat(tax);
    if (total_amount !== undefined) updateData.total_amount = parseFloat(total_amount);
    if (payment_method_id !== undefined) updateData.payment_method_id = payment_method_id;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await sale.update(updateData, { transaction });

    // Update sale items if provided
    if (saleItems && Array.isArray(saleItems)) {
      // Delete existing sale items
      await PosSaleItem.destroy({
        where: { sale_id: saleId },
        transaction
      });

      // Create new sale items
      const saleItemsData = saleItems.map(item => {
        const quantity = parseFloat(item.quantity);
        const unit_price = parseFloat(item.unit_price);
        const item_discount = parseFloat(item.discount || 0);
        const item_tax = parseFloat(item.tax || 0);
        const line_total = (quantity * unit_price) - item_discount + item_tax;
        
        return {
          sale_id: saleId,
          product_id: item.product_id,
          quantity: quantity,
          unit_price: unit_price,
          discount: item_discount,
          tax: item_tax,
          line_total: line_total
        };
      });

      await PosSaleItem.bulkCreate(saleItemsData, { transaction });
    }

    await transaction.commit();

    // Fetch the updated sale with all associations
    const updatedSale = await getById(saleId);
    return updatedSale;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Delete POS sale
 */
const deleteSale = async (saleId) => {
  const transaction = await sequelize.transaction();

  try {
    const sale = await PosSale.findByPk(saleId, { transaction });
    if (!sale) {
      throw new Error('POS sale not found');
    }

    // Check if sale can be deleted (only if not completed or if cancelled)
    if (sale.status === 'COMPLETED' && sale.payment_status === 'PAID') {
      throw new Error('Cannot delete a completed and paid sale');
    }

    // Delete sale items (cascade will handle this, but explicit for clarity)
    await PosSaleItem.destroy({
      where: { sale_id: saleId },
      transaction
    });

    // Delete the sale
    await sale.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  delete: deleteSale
};

