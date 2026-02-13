'use strict';

const {
  Inventory,
  Product,
  Location,
  Category,
  PosSale,
  PosSaleItem,
  Client,
  Supplier,
  SupplierProduct
} = require('../model');
const { Op, fn, col } = require('sequelize');

/**
 * Get Critical Stock Levels by Location
 * Returns location-wise product inventory with available and reserved quantities
 */
const getCriticalStockLevels = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { 
      company_id,
      location_id
    } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const companyId = parseInt(company_id);

    // Build where clause for filtering
    const whereClause = {};

    // Filter by location if provided
    if (location_id) {
      whereClause.location_id = location_id;
    }

    // Get all inventory data with location and product details
    const inventoryData = await Inventory.findAll({
      where: whereClause,
      include: [
        {
          model: Location,
          as: 'location',
          where: {
            company_id: companyId
          },
          attributes: ['location_id', 'name', 'address', 'phone']
        },
        {
          model: Product,
          as: 'product',
          where: {
            company_id: companyId
          },
          attributes: ['product_id', 'name', 'sku', 'unit', 'cost_price', 'selling_price'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['category_id', 'name']
            }
          ]
        }
      ],
      attributes: [
        'inventory_id',
        'location_id',
        'product_id',
        'quantity',
        'reserved_quantity',
        'last_updated'
      ],
      order: [['location_id', 'ASC'], ['product_id', 'ASC']]
    });

    // Format the response data
    const formattedData = inventoryData.map(item => {
      const availableQuantity = parseFloat(item.quantity || 0) - parseFloat(item.reserved_quantity || 0);
      
      return {
        inventory_id: item.inventory_id,
        location: {
          location_id: item.location?.location_id,
          name: item.location?.name,
          address: item.location?.address,
          phone: item.location?.phone
        },
        product: {
          product_id: item.product?.product_id,
          name: item.product?.name,
          sku: item.product?.sku,
          unit: item.product?.unit,
          cost_price: item.product?.cost_price,
          selling_price: item.product?.selling_price,
          category: item.product?.category ? {
            category_id: item.product.category.category_id,
            name: item.product.category.name
          } : null
        },
        total_quantity: parseFloat(item.quantity || 0),
        reserved_quantity: parseFloat(item.reserved_quantity || 0),
        available_quantity: availableQuantity,
        last_updated: item.last_updated,
        status: availableQuantity <= 0 ? 'Out of Stock' : 
                availableQuantity < 20 ? 'Critical' : 
                availableQuantity < 50 ? 'Low' : 'Normal'
      };
    });

    // Filter only critical items (Out of Stock and Critical only)
    const criticalItems = formattedData.filter(item => 
      item.status === 'Out of Stock' || item.status === 'Critical'
    );

    res.json({
      success: true,
      message: 'Critical stock levels retrieved successfully',
      data: criticalItems
    });

  } catch (error) {
    console.error('Critical stock levels error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve critical stock levels',
      error: error.message
    });
  }
};

/**
 * Get Stock Summary by Location
 * Returns aggregated stock summary for each location
 */
const getStockSummaryByLocation = async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const companyId = parseInt(company_id);

    // Get all locations for the company
    const locations = await Location.findAll({
      where: { company_id: companyId },
      attributes: ['location_id', 'name', 'address'],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: [
            'location_id',
            [Inventory.sequelize.fn('COUNT', Inventory.sequelize.col('inventory.product_id')), 'total_products'],
            [Inventory.sequelize.fn('SUM', Inventory.sequelize.col('inventory.quantity')), 'total_quantity'],
            [Inventory.sequelize.fn('SUM', Inventory.sequelize.col('inventory.reserved_quantity')), 'total_reserved']
          ]
        }
      ],
      group: ['Location.location_id', 'Location.name', 'Location.address']
    });

    // Format the response
    const summary = locations.map(location => {
      const inventory = location.inventory && location.inventory.length > 0 ? location.inventory[0] : null;
      const totalQuantity = parseFloat(inventory?.dataValues?.total_quantity || 0);
      const totalReserved = parseFloat(inventory?.dataValues?.total_reserved || 0);
      const totalProducts = parseInt(inventory?.dataValues?.total_products || 0);

      return {
        location_id: location.location_id,
        location_name: location.name,
        location_address: location.address,
        total_products: totalProducts,
        total_quantity: totalQuantity,
        total_reserved: totalReserved,
        available_quantity: totalQuantity - totalReserved
      };
    });

    res.json({
      success: true,
      message: 'Stock summary by location retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Stock summary error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stock summary',
      error: error.message
    });
  }
};

/**
 * Get Zero Quantity Alerts by Location
 * Returns location-wise products with zero quantity in inventory
 */
const getZeroQuantityAlerts = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { 
      company_id,
      location_id
    } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const companyId = parseInt(company_id);

    // Build where clause for location filtering
    const locationWhereClause = {
      company_id: companyId
    };

    // Filter by specific location if provided
    if (location_id) {
      locationWhereClause.location_id = location_id;
    }

    // Get all locations for the company
    const locations = await Location.findAll({
      where: locationWhereClause,
      attributes: ['location_id', 'name', 'address', 'phone'],
      order: [['name', 'ASC']]
    });

    // Get all products for the company
    const products = await Product.findAll({
      where: {
        company_id: companyId
      },
      attributes: ['product_id', 'name', 'sku', 'unit', 'cost_price', 'selling_price'],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['category_id', 'name']
        }
      ]
    });


    // For each location, find products with zero quantity
    const locationZeroQuantityData = [];

    for (const location of locations) {
      const zeroQuantityProducts = [];

      for (const product of products) {
        // Check if inventory exists for this location-product combination
        const inventoryRecord = await Inventory.findOne({
          where: {
            location_id: location.location_id,
            product_id: product.product_id
          },
          attributes: ['inventory_id', 'quantity', 'reserved_quantity', 'last_updated']
        });

        // Include if:
        // 1. No inventory record exists (implying 0 quantity)
        // 2. Inventory record exists with quantity = 0
        if (!inventoryRecord || parseFloat(inventoryRecord.quantity || 0) === 0) {
          zeroQuantityProducts.push({
            inventory_id: inventoryRecord?.inventory_id || null,
            product: {
              product_id: product.product_id,
              name: product.name,
              sku: product.sku,
              unit: product.unit,
              cost_price: product.cost_price,
              selling_price: product.selling_price,
              category: product.category ? {
                category_id: product.category.category_id,
                name: product.category.name
              } : null
            },
            total_quantity: inventoryRecord ? parseFloat(inventoryRecord.quantity || 0) : 0,
            reserved_quantity: inventoryRecord ? parseFloat(inventoryRecord.reserved_quantity || 0) : 0,
            available_quantity: 0,
            last_updated: inventoryRecord?.last_updated || null,
            status: 'Out of Stock'
          });
        }
      }

      // Only include locations that have zero quantity products
      if (zeroQuantityProducts.length > 0) {
        locationZeroQuantityData.push({
          location: {
            location_id: location.location_id,
            name: location.name,
            address: location.address,
            phone: location.phone
          },
          products: zeroQuantityProducts,
          total_zero_products: zeroQuantityProducts.length
        });
      }
    }

    res.json({
      success: true,
      message: 'Zero quantity alerts retrieved successfully',
      data: locationZeroQuantityData
    });

  } catch (error) {
    console.error('Zero quantity alerts error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve zero quantity alerts',
      error: error.message
    });
  }
};

/**
 * Get Supplier Supply Analysis
 * Returns supplier-wise product supply details across locations
 */
const getSupplierSupplyAnalysis = async (req, res) => {
  try {
    const { company_id, location_id } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const companyId = parseInt(company_id, 10);
    const locationFilter = location_id ? parseInt(location_id, 10) : null;

    const supplierProductRecords = await SupplierProduct.findAll({
      where: { company_id: companyId },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['supplier_id', 'name', 'contact_name', 'email', 'phone']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['product_id', 'name', 'sku', 'unit']
        }
      ]
    });

    const supplierLinks = supplierProductRecords.map(record => record.get({ plain: true }));

    if (!supplierLinks.length) {
      return res.json({
        success: true,
        message: 'No supplier supply data found for the selected filters.',
        data: []
      });
    }

    const productIds = Array.from(
      new Set(
        supplierLinks
          .map(link => link?.product?.product_id)
          .filter(Boolean)
      )
    );

    if (!productIds.length) {
      return res.json({
        success: true,
        message: 'No supplier supply data found for the selected filters.',
        data: []
      });
    }

    const locationWhere = { company_id: companyId };
    if (locationFilter) {
      locationWhere.location_id = locationFilter;
    }

    const locations = await Location.findAll({
      where: locationWhere,
      attributes: ['location_id', 'name', 'address', 'phone'],
      raw: true
    });

    const locationMap = new Map();
    locations.forEach(location => {
      locationMap.set(Number(location.location_id), {
        location_id: Number(location.location_id),
        name: location.name,
        address: location.address || null,
        phone: location.phone || null
      });
    });

    const inventoryWhere = {
      product_id: {
        [Op.in]: productIds
      }
    };

    if (locationFilter) {
      inventoryWhere.location_id = locationFilter;
    }

    const inventoryRecords = await Inventory.findAll({
      where: inventoryWhere,
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['location_id', 'name', 'address', 'phone'],
          where: locationWhere,
          required: true
        }
      ],
      attributes: ['inventory_id', 'product_id', 'location_id', 'quantity', 'reserved_quantity', 'last_updated']
    });

    const inventoryPlain = inventoryRecords.map(record => record.get({ plain: true }));

    const productLocationsMap = new Map();
    const inventoryMap = new Map();

    inventoryPlain.forEach(inv => {
      const productId = Number(inv.product_id);
      const locationId = Number(inv.location_id);
      const key = `${productId}:${locationId}`;
      const quantity = parseFloat(inv.quantity ?? 0) || 0;
      const reserved = parseFloat(inv.reserved_quantity ?? 0) || 0;
      const total = quantity + reserved;

      if (!productLocationsMap.has(productId)) {
        productLocationsMap.set(productId, new Set());
      }
      productLocationsMap.get(productId).add(locationId);

      if (inv.location) {
        locationMap.set(locationId, {
          location_id: Number(inv.location.location_id),
          name: inv.location.name,
          address: inv.location.address || null,
          phone: inv.location.phone || null
        });
      }

      const existing = inventoryMap.get(key) || {
        quantity: 0,
        last_updated: null,
        location: inv.location
          ? {
              location_id: Number(inv.location.location_id),
              name: inv.location.name,
              address: inv.location.address || null,
              phone: inv.location.phone || null
            }
          : null
      };

      existing.quantity += total;

      if (inv.last_updated) {
        const invDate = new Date(inv.last_updated);
        if (!existing.last_updated || invDate > existing.last_updated) {
          existing.last_updated = invDate;
        }
      }

      inventoryMap.set(key, existing);
    });

    const saleIncludeWhere = {
      company_id: companyId,
      status: 'COMPLETED',
      payment_status: 'PAID'
    };

    if (locationFilter) {
      saleIncludeWhere.location_id = locationFilter;
    }

    const salesAgg = await PosSaleItem.findAll({
      attributes: [
        [col('PosSaleItem.product_id'), 'product_id'],
        [col('sale.location_id'), 'location_id'],
        [fn('SUM', col('PosSaleItem.quantity')), 'total_sold'],
        [fn('MAX', col('sale.sale_date')), 'last_sale']
      ],
      where: {
        product_id: {
          [Op.in]: productIds
        }
      },
      include: [
        {
          model: PosSale,
          as: 'sale',
          attributes: [],
          where: saleIncludeWhere,
          required: true
        }
      ],
      group: ['PosSaleItem.product_id', 'sale.location_id'],
      raw: true
    });

    const salesMap = new Map();
    salesAgg.forEach(row => {
      const productId = Number(row.product_id);
      const locationId = Number(row.location_id);
      const key = `${productId}:${locationId}`;
      const sold = parseFloat(row.total_sold ?? 0) || 0;
      const lastSale = row.last_sale ? new Date(row.last_sale) : null;

      salesMap.set(key, { sold, last_sale: lastSale });

      if (!productLocationsMap.has(productId)) {
        productLocationsMap.set(productId, new Set());
      }
      productLocationsMap.get(productId).add(locationId);
    });

    const supplierDataMap = new Map();

    supplierLinks.forEach(link => {
      const supplierInfo = link.supplier;
      const productInfo = link.product;

      if (!supplierInfo || !productInfo) {
        return;
      }

      const supplierId = Number(supplierInfo.supplier_id);
      if (!supplierDataMap.has(supplierId)) {
        supplierDataMap.set(supplierId, {
          supplier: {
            supplier_id: supplierId,
            name: supplierInfo.name,
            contact_name: supplierInfo.contact_name || null,
            email: supplierInfo.email || null,
            phone: supplierInfo.phone || null
          },
          productSet: new Set(),
          total_quantity_supplied: 0,
          products: []
        });
      }

      const supplierEntry = supplierDataMap.get(supplierId);
      const productId = Number(productInfo.product_id);
      const locationSet = productLocationsMap.get(productId);

      if (!locationSet || locationSet.size === 0) {
        return;
      }

      const productPayload = {
        product_id: productId,
        name: productInfo.name,
        sku: productInfo.sku || null,
        unit: productInfo.unit || null
      };

      locationSet.forEach(locationId => {
        const inventoryKey = `${productId}:${locationId}`;
        const inventoryEntry = inventoryMap.get(inventoryKey);
        const salesEntry = salesMap.get(inventoryKey);

        const inventoryQuantity = inventoryEntry ? inventoryEntry.quantity : 0;
        const soldQuantity = salesEntry ? salesEntry.sold : 0;
        const totalSupplied = inventoryQuantity + soldQuantity;

        if (totalSupplied <= 0) {
          return;
        }

        let latestDate = null;
        if (inventoryEntry && inventoryEntry.last_updated) {
          latestDate = inventoryEntry.last_updated instanceof Date
            ? inventoryEntry.last_updated
            : new Date(inventoryEntry.last_updated);
        }

        if (salesEntry && salesEntry.last_sale) {
          const saleDate = salesEntry.last_sale;
          if (!latestDate || saleDate > latestDate) {
            latestDate = saleDate;
          }
        }

        const locationInfo =
          locationMap.get(locationId) ||
          (inventoryEntry && inventoryEntry.location) ||
          null;

        supplierEntry.products.push({
          product: productPayload,
          location: locationInfo
            ? {
                location_id: locationInfo.location_id,
                name: locationInfo.name,
                address: locationInfo.address || null
              }
            : {
                location_id: locationId,
                name: `Location ${locationId}`,
                address: null
              },
          total_supplied: Number(totalSupplied.toFixed(2)),
          last_supply_date: latestDate ? latestDate.toISOString() : null
        });

        supplierEntry.total_quantity_supplied += totalSupplied;
        supplierEntry.productSet.add(productId);
      });
    });

    const responseData = Array.from(supplierDataMap.values())
      .map(entry => ({
        supplier: entry.supplier,
        total_products: entry.productSet.size,
        total_quantity_supplied: Number(entry.total_quantity_supplied.toFixed(2)),
        products: entry.products.sort((a, b) => b.total_supplied - a.total_supplied)
      }))
      .filter(entry => entry.products.length > 0)
      .sort((a, b) => b.total_quantity_supplied - a.total_quantity_supplied);

    const message = responseData.length
      ? 'Supplier supply analysis retrieved successfully'
      : 'No supplier supply data found for the selected filters.';

    res.json({
      success: true,
      message,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching supplier supply analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supplier supply analysis',
      error: error.message
    });
  }
};

/**
 * Get Product Purchase Analysis
 * Returns comprehensive purchase information for all products
 */
const getProductPurchaseAnalysis = async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    res.json({
      success: true,
      message: 'Product purchase analysis is not available because purchase orders are no longer tracked in the POS-only workflow.',
      data: []
    });
  } catch (error) {
    console.error('Product purchase analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product purchase analysis',
      error: error.message
    });
  }
};

/**
 * Get Selling Report
 * Returns sales data with filtering by month, location, and search
 */
const getSellingReport = async (req, res) => {
  try {
    const { 
      company_id,
      month,
      location_id,
      search,
      page = 1,
      limit = 10,
      sortBy = 'order_date',
      sortOrder = 'DESC'
    } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const companyId = parseInt(company_id);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const saleWhereClause = {
      company_id: companyId
    };

    if (location_id) {
      saleWhereClause.location_id = parseInt(location_id);
    }

    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
      saleWhereClause.sale_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const searchConditions = [];
    if (search) {
      const likeTerm = `%${search}%`;
      searchConditions.push(
        { '$sale.invoice_number$': { [Op.like]: likeTerm } },
        { '$sale.status$': { [Op.like]: likeTerm } },
        { '$sale.payment_status$': { [Op.like]: likeTerm } },
        { '$sale.location.name$': { [Op.like]: likeTerm } },
        { '$sale.client.name$': { [Op.like]: likeTerm } },
        { '$sale.client.email$': { [Op.like]: likeTerm } },
        { '$product.name$': { [Op.like]: likeTerm } },
        { '$product.sku$': { [Op.like]: likeTerm } }
      );
    }

    const sortFieldMap = {
      order_date: 'sale_date',
      sale_date: 'sale_date',
      order_id: 'sale_id',
      invoice_number: 'invoice_number'
    };
    const resolvedSortField = sortFieldMap[sortBy] || sortBy;

    const { count, rows: saleItems } = await PosSaleItem.findAndCountAll({
      where: searchConditions.length > 0 ? { [Op.or]: searchConditions } : {},
      include: [
        {
          model: PosSale,
          as: 'sale',
          where: saleWhereClause,
          attributes: ['sale_id', 'invoice_number', 'sale_date', 'status', 'payment_status', 'location_id'],
          include: [
            {
              model: Location,
              as: 'location',
              attributes: ['location_id', 'name', 'address'],
              required: false
            },
            {
              model: Client,
              as: 'client',
              attributes: ['client_id', 'name', 'email', 'phone'],
              required: false
            }
          ]
        },
        {
          model: Product,
          as: 'product',
          where: { company_id: companyId },
          attributes: ['product_id', 'name', 'sku', 'unit']
        }
      ],
      attributes: ['item_id', 'product_id', 'quantity', 'unit_price', 'discount', 'tax', 'line_total'],
      limit: limitNum,
      offset,
      order: [
        [{ model: PosSale, as: 'sale' }, resolvedSortField, sortOrder.toUpperCase()]
      ],
      distinct: true
    });

    const formattedData = saleItems.map(item => {
      const sale = item.sale;
      const location = sale?.location;
      const client = sale?.client;
      const quantity = parseFloat(item.quantity || 0);
      const unitPrice = parseFloat(item.unit_price || 0);
      const discount = parseFloat(item.discount || 0);
      const tax = parseFloat(item.tax || 0);
      const lineTotal = item.line_total !== null && item.line_total !== undefined
        ? parseFloat(item.line_total)
        : quantity * unitPrice - discount + tax;

      return {
        order_id: sale.sale_id,
        invoice_number: sale.invoice_number,
        order_date: sale.sale_date,
        order_status: sale.status,
        payment_status: sale.payment_status,
        location: {
          location_id: location?.location_id || null,
          name: location?.name || 'Unknown Location',
          address: location?.address || null
        },
        customer: client ? {
          client_id: client.client_id,
          name: client.name,
          email: client.email,
          phone: client.phone
        } : {
          client_id: null,
          name: 'Walk-in Customer',
          email: null,
          phone: null
        },
        product: {
          product_id: item.product.product_id,
          name: item.product.name,
          sku: item.product.sku,
          unit: item.product.unit
        },
        quantity_sold: quantity,
        unit_price: unitPrice,
        discount,
        tax,
        total_price: lineTotal
      };
    });

    const totalRevenue = formattedData.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const totalSales = formattedData.reduce((sum, item) => sum + (item.quantity_sold || 0), 0);
    const uniqueOrders = new Set(formattedData.map(item => item.order_id)).size;
    const avgOrderValue = uniqueOrders > 0 ? totalRevenue / uniqueOrders : 0;
    const totalPages = Math.ceil(count / limitNum);

    res.json({
      success: true,
      message: 'Selling report retrieved successfully',
      data: formattedData,
      summary: {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_orders: uniqueOrders,
        avg_order_value: avgOrderValue
      },
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: count,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Selling report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve selling report',
      error: error.message
    });
  }
};

/**
 * Get Purchase Report
 * Returns purchase data with filtering by month, location, and search
 */
const getPurchaseReport = async (req, res) => {
  try {
    const { company_id, page = 1, limit = 10 } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    res.json({
      success: true,
      message: 'Purchase reports are not available because purchase orders are no longer tracked in the POS-only workflow.',
      data: [],
      summary: {
        total_spent: 0,
        total_quantity: 0,
        total_orders: 0,
        avg_order_value: 0
      },
      pagination: {
        currentPage: parseInt(page, 10) || 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: parseInt(limit, 10) || 10
      }
    });
  } catch (error) {
    console.error('Purchase report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchase report',
      error: error.message
    });
  }
};

module.exports = {
  getCriticalStockLevels,
  getStockSummaryByLocation,
  getZeroQuantityAlerts,
  getSupplierSupplyAnalysis,
  getProductPurchaseAnalysis,
  getSellingReport,
  getPurchaseReport
};

