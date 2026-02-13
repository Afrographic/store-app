'use strict';

const { Inventory, Product, Category, Location, StockoutImpactCache, sequelize } = require('../model');
const openaiService = require('./openaiService');
const config = require('../config/config');

/**
 * Get stockout periods from inventory and stock movements
 */
const getStockoutPeriods = async (filters = {}) => {
  try {
    const { company_id, location_id, product_id, category_id, days = 90 } = filters;

    // Get products with inventory or sales history
    const products = await sequelize.query(`
      SELECT DISTINCT
        p.product_id,
        p.name as product_name,
        p.sku,
        p.selling_price,
        p.cost_price,
        p.category_id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.company_id = :company_id
        ${product_id ? 'AND p.product_id = :product_id' : ''}
        ${category_id ? 'AND p.category_id = :category_id' : ''}
    `, {
      replacements: { company_id, product_id: product_id || null, category_id: category_id || null },
      type: sequelize.QueryTypes.SELECT
    });


    // Analyze current stockouts and recent sales
    const stockoutData = [];
    for (const product of products) {
      // Get current inventory
      const whereClause = location_id
        ? { product_id: product.product_id, location_id }
        : { product_id: product.product_id };

      const inventories = await Inventory.findAll({ where: whereClause });

      let hasStockout = false;
      let stockoutCount = 0;

      // Check for zero or low inventory across all locations
      for (const inv of inventories) {
        const quantity = parseFloat(inv.quantity || 0);
        const reserved = parseFloat(inv.reserved_quantity || 0);
        const available = quantity - reserved;

        if (available <= 0) {
          hasStockout = true;
          stockoutCount++;
        }
      }

      // Only include products with current stockouts and sales history
      if (hasStockout) {
        // Get sales history to estimate lost revenue
        const salesCount = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM pos_sale_items psi
          JOIN pos_sales ps ON psi.sale_id = ps.sale_id
          WHERE psi.product_id = :product_id
            AND ps.company_id = :company_id
            ${location_id ? 'AND ps.location_id = :location_id' : ''}
            AND ps.status = 'COMPLETED'
            AND ps.payment_status = 'PAID'
        `, {
          replacements: {
            product_id: product.product_id,
            company_id,
            location_id: location_id || null
          },
          type: sequelize.QueryTypes.SELECT
        });

        if (salesCount[0].count > 0) {
          stockoutData.push({
            product_id: product.product_id,
            product_name: product.product_name,
            sku: product.sku,
            category: product.category_name,
            selling_price: parseFloat(product.selling_price || 0),
            stockout_count: stockoutCount,
            total_stockout_days: 1, // Current stockout
            current_stockout: true
          });
        }
      }
    }

    return stockoutData;
  } catch (error) {
    throw new Error(`Error analyzing stockouts: ${error.message}`);
  }
};

/**
 * Get lost sales for current stockout
 */
const getLostSales = async (productId, companyId, stockoutDays = 1, locationId = null) => {
  try {
    const product = await Product.findOne({
      where: {
        product_id: productId,
        company_id: companyId
      }
    });
    if (!product || !product.selling_price) return 0;

    const sellingPrice = parseFloat(product.selling_price || 0);

    // Get recent POS sales history (last 50 records)
    const salesRecords = await sequelize.query(`
      SELECT psi.quantity, ps.sale_date
      FROM pos_sale_items psi
      JOIN pos_sales ps ON psi.sale_id = ps.sale_id
      WHERE psi.product_id = :product_id
        AND ps.company_id = :company_id
        ${locationId ? 'AND ps.location_id = :location_id' : ''}
        AND ps.status = 'COMPLETED'
        AND ps.payment_status = 'PAID'
      ORDER BY ps.sale_date DESC
      LIMIT 50
    `, {
      replacements: {
        product_id: productId,
        company_id: companyId,
        location_id: locationId || null
      },
      type: sequelize.QueryTypes.SELECT
    });

    if (salesRecords.length === 0) return 0;

    // Calculate average daily sales
    const totalQty = salesRecords.reduce((sum, record) => sum + parseFloat(record.quantity), 0);
    const lastSaleDate = new Date(salesRecords[0].sale_date);
    const firstSaleDate = new Date(salesRecords[salesRecords.length - 1].sale_date);
    const days = Math.max(1, Math.ceil((lastSaleDate - firstSaleDate) / (1000 * 60 * 60 * 24)) + 1);
    const avgDailySales = totalQty / days;

    // Estimate lost revenue for current stockout
    const lostQuantity = avgDailySales * stockoutDays;
    return lostQuantity * sellingPrice;
  } catch (error) {
    console.error(`Error calculating lost sales for product ${productId}:`, error);
    return 0;
  }
};

/**
 * Generate cache key
 */
const generateCacheKey = (params) => {
  const { company_id, location_id, product_id, category_id, analysis_days } = params;
  return `stockout:${company_id}:${location_id || 'all'}:${product_id || 'all'}:${category_id || 'all'}:${analysis_days}`;
};

/**
 * Get cached data
 */
const getCachedData = async (cacheKey) => {
  if (!config.aiReportCache?.enabled) return null;

  try {
    const cache = await StockoutImpactCache.findOne({ where: { cache_key: cacheKey } });
    if (!cache) return null;

    if (new Date(cache.expires_at) < new Date()) {
      await cache.destroy();
      return null;
    }

    return cache.impact_data;
  } catch (error) {
    console.error('Error fetching cache:', error);
    return null;
  }
};

/**
 * Set cached data
 */
const setCachedData = async (params, data) => {
  if (!config.aiReportCache?.enabled) return;

  try {
    const { company_id, location_id, product_id, category_id, analysis_days } = params;
    const cacheKey = generateCacheKey(params);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (config.aiReportCache.ttl || 1));

    await StockoutImpactCache.upsert({
      company_id, location_id, product_id, category_id, analysis_days,
      cache_key: cacheKey,
      impact_data: data,
      expires_at: expiresAt
    });
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

/**
 * Generate stockout impact analysis using AI
 */
const generateImpactAnalysis = async (params = {}) => {
  try {
    const { company_id, location_id = null, product_id = null, category_id = null, analysis_days = 90 } = params;

    if (!company_id) {
      throw new Error('Company ID is required');
    }

    // Check cache
    const cacheKey = generateCacheKey(params);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached stockout analysis for: ${cacheKey}`);
      return cached;
    }

    // Get stockout data
    const stockoutData = await getStockoutPeriods({
      company_id, location_id, product_id, category_id, days: analysis_days
    });

    if (stockoutData.length === 0) {
      return {
        success: true,
        company_id,
        location_id,
        generated_at: new Date().toISOString(),
        analysis_period_days: analysis_days,
        impacts: [],
        summary: { total_stockouts: 0, total_lost_revenue: 0, critical_products: 0 }
      };
    }

    // Calculate lost revenue for each product
    const productsWithImpact = [];
    for (const item of stockoutData) {
      const lostRevenue = await getLostSales(item.product_id, company_id, item.total_stockout_days, location_id);
      const customerImpact = item.stockout_count > 2 ? 'HIGH' : item.stockout_count > 1 ? 'MEDIUM' : 'LOW';

      productsWithImpact.push({
        id: item.product_id,
        name: item.product_name,
        sku: item.sku,
        cat: item.category,
        stockouts: item.stockout_count,
        days: item.total_stockout_days,
        lost_rev: Math.round(lostRevenue),
        impact: customerImpact,
        price: item.selling_price
      });
    }

    // Limit to top 30 for AI efficiency
    const topProducts = productsWithImpact.sort((a, b) => b.lost_rev - a.lost_rev).slice(0, 30);

    // Create minimal AI prompt
    const prompt = `Analyze stockout impact for ${topProducts.length} products.

Data: ${JSON.stringify(topProducts)}

Return JSON:
{
  "impacts": [
    {
      "product_id": number,
      "product_name": "string",
      "lost_revenue": number,
      "stockout_frequency": number,
      "customer_impact_score": "HIGH|MEDIUM|LOW",
      "recovery_actions": []
    }
  ],
  "summary": {
    "total_lost_revenue": number,
    "critical_product_count": number,
    "urgency_high": number
  }
}

Set recovery_actions based on impact: for HIGH impact suggest reorder, safety stock; for MEDIUM suggest restock monitoring.`;

    // Get AI analysis
    const completion = await openaiService.chatCompletion(company_id, {
      model: openaiService.getDefaultModel(),
      messages: [
        { role: 'system', content: 'Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: 'json_object'
    });

    let aiResult;
    try {
      aiResult = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Enhance with additional metrics
    const enhancedImpacts = aiResult.impacts.map(impact => {
      const product = topProducts.find(p => p.id === impact.product_id);
      return {
        product_id: impact.product_id,
        product_name: impact.product_name,
        sku: product?.sku || null,
        category: product?.cat || null,
        lost_revenue: impact.lost_revenue,
        stockout_frequency: impact.stockout_frequency,
        stockout_days: product?.days || 0,
        customer_impact_score: impact.customer_impact_score,
        recovery_actions: impact.recovery_actions,
        recovery_potential_percentage: impact.lost_revenue > 0 ? Math.min(25, (impact.lost_revenue / 1000) * 2) : 0
      };
    });

    const result = {
      success: true,
      company_id,
      location_id,
      generated_at: new Date().toISOString(),
      analysis_period_days: analysis_days,
      impacts: enhancedImpacts,
      summary: {
        total_products_affected: topProducts.length,
        total_lost_revenue: aiResult.summary.total_lost_revenue,
        critical_products_count: aiResult.summary.critical_product_count,
        high_urgency_count: aiResult.summary.urgency_high
      }
    };

    // Cache result
    await setCachedData(params, result);

    return result;
  } catch (error) {
    throw new Error(`Error generating impact analysis: ${error.message}`);
  }
};

module.exports = {
  generateImpactAnalysis,
  getStockoutPeriods,
  generateCacheKey,
  getCachedData,
  setCachedData
};

