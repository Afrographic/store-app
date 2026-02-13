'use strict';

const { sequelize, CrossSellCache } = require('../model');
const openaiService = require('./openaiService');
const config = require('../config/config');

/**
 * Generate cache key
 */
const generateCacheKey = (params) => {
  const { company_id, location_id = null, product_id = null, category_id = null, historical_days = 365 } = params;
  return `crosssell:${company_id}:${location_id || 'all'}:${product_id || 'all'}:${category_id || 'all'}:${historical_days}`;
};

/**
 * Get cached result
 */
const getCachedCrossSell = async (cacheKey) => {
  if (!config.aiReportCache?.enabled) return null;
  try {
    const entry = await CrossSellCache.findOne({ where: { cache_key: cacheKey } });
    if (!entry) return null;
    if (new Date(entry.expires_at) < new Date()) {
      await entry.destroy();
      return null;
    }
    return entry.cross_sell_data;
  } catch (e) {
    return null;
  }
};

/**
 * Set cache
 */
const setCachedCrossSell = async (params, data) => {
  if (!config.aiReportCache?.enabled) return;
  const { company_id, location_id = null, product_id = null, category_id = null, historical_days = 365 } = params;
  const cache_key = generateCacheKey(params);
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + (config.aiReportCache.ttl || 1));
  await CrossSellCache.upsert({
    company_id,
    location_id,
    product_id,
    category_id,
    historical_days,
    cache_key,
    cross_sell_data: data,
    expires_at
  });
};

/**
 * Build compact co-purchase signals (minimal tokens)
 */
const buildCoPurchaseSignals = async (params = {}) => {
  const { company_id, location_id = null, product_id = null, category_id = null, historical_days = 365 } = params;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - historical_days);

  // Compute co-purchase pairs from POS sale items within completed sales
  const pairs = await sequelize.query(`
    WITH filtered_sales AS (
      SELECT ps.sale_id
      FROM pos_sales ps
      WHERE ps.status = 'COMPLETED'
        AND ps.payment_status = 'PAID'
        AND ps.sale_date BETWEEN :startDate AND :endDate
        ${company_id ? 'AND ps.company_id = :company_id' : ''}
        ${location_id ? 'AND ps.location_id = :location_id' : ''}
    ),
    items AS (
      SELECT psi.sale_id, psi.product_id
      FROM pos_sale_items psi
      INNER JOIN filtered_sales fs ON fs.sale_id = psi.sale_id
    ),
    prod_filter AS (
      SELECT p.product_id, p.category_id, p.name, p.sku
      FROM products p
      ${category_id ? 'WHERE p.category_id = :category_id' : ''}
    ),
    scoped_items AS (
      SELECT i.sale_id, i.product_id
      FROM items i
      INNER JOIN prod_filter pf ON pf.product_id = i.product_id
      ${product_id ? 'WHERE i.product_id = :product_id' : ''}
    )
    SELECT a.product_id as product_a,
           b.product_id as product_b,
           COUNT(DISTINCT a.sale_id) as together_count
    FROM scoped_items a
    JOIN scoped_items b ON a.sale_id = b.sale_id AND a.product_id < b.product_id
    GROUP BY a.product_id, b.product_id
    HAVING together_count >= 2
    ORDER BY together_count DESC
    LIMIT 500;
  `, {
    replacements: { startDate, endDate, company_id: company_id || null, location_id: location_id || null, product_id: product_id || null, category_id: category_id || null },
    type: sequelize.QueryTypes.SELECT
  });

  if (!pairs.length) return { pairs: [], products: {} };

  // Fetch product level stats for lift approximation
  const productCounts = await sequelize.query(`
    SELECT psi.product_id, COUNT(DISTINCT psi.sale_id) as order_count
    FROM pos_sale_items psi
    INNER JOIN pos_sales ps ON ps.sale_id = psi.sale_id
    WHERE ps.status = 'COMPLETED'
      AND ps.payment_status = 'PAID'
      AND ps.sale_date BETWEEN :startDate AND :endDate
      ${company_id ? 'AND ps.company_id = :company_id' : ''}
      ${location_id ? 'AND ps.location_id = :location_id' : ''}
    GROUP BY psi.product_id;
  `, {
    replacements: { startDate, endDate, company_id: company_id || null, location_id: location_id || null },
    type: sequelize.QueryTypes.SELECT
  });

  const productMap = {};
  productCounts.forEach(r => { productMap[r.product_id] = { orders: parseInt(r.order_count || 0) }; });

  // Compact signals for AI
  const signals = pairs.map(p => {
    const aOrders = productMap[p.product_a]?.orders || 1;
    const bOrders = productMap[p.product_b]?.orders || 1;
    const support = p.together_count;
    const confidenceAB = support / aOrders;
    const confidenceBA = support / bOrders;
    const lift = support / Math.max(1, Math.sqrt(aOrders * bOrders));
    return { a: p.product_a, b: p.product_b, support, conf_ab: +confidenceAB.toFixed(4), conf_ba: +confidenceBA.toFixed(4), lift: +lift.toFixed(4) };
  })
    .sort((x, y) => (y.lift - x.lift) || (y.support - x.support))
    .slice(0, 100);

  return { pairs: signals, products: productMap };
};

/**
 * Generate cross-sell and bundle opportunities
 */
const generateCrossSell = async (params = {}) => {
  const { company_id } = params;
  if (!company_id) throw new Error('Company ID is required for cross-sell analysis');

  const cacheKey = generateCacheKey(params);
  const cached = await getCachedCrossSell(cacheKey);
  if (cached) return cached;

  const signals = await buildCoPurchaseSignals(params);
  if (!signals.pairs.length) throw new Error('Insufficient co-purchase data for cross-sell analysis');

  // Minimal prompt for token efficiency
  const prompt = `Identify top cross-sell and bundle suggestions.
Pairs (compact): ${JSON.stringify(signals.pairs)}
Return JSON only:
{
  "suggestions": [
    { "product_a": number, "product_b": number, "affinity": number, "suggestion": "string", "expected_aov_lift_pct": number }
  ],
  "bundles": [
    { "products": [number, number], "label": "string", "expected_aov_lift_pct": number }
  ]
}`;

  const completion = await openaiService.chatCompletion(company_id, {
    model: openaiService.getDefaultModel(),
    messages: [
      { role: 'system', content: 'Return valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    response_format: 'json_object'
  });

  let result;
  try {
    result = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    throw new Error(`Failed to parse OpenAI response: ${e.message}`);
  }

  // Collect all unique product IDs
  const productIds = new Set();
  (result.suggestions || []).forEach(s => {
    productIds.add(s.product_a);
    productIds.add(s.product_b);
  });
  (result.bundles || []).forEach(b => {
    (b.products || []).forEach(id => productIds.add(id));
  });

  // Fetch product names
  let productMap = {};
  if (productIds.size > 0) {
    const productNames = await sequelize.query(`
      SELECT product_id, name, sku
      FROM products
      WHERE product_id IN (:productIds)
        AND company_id = :company_id
    `, {
      replacements: { productIds: Array.from(productIds), company_id },
      type: sequelize.QueryTypes.SELECT
    });

    productNames.forEach(p => {
      productMap[p.product_id] = { name: p.name, sku: p.sku };
    });
  }

  const response = {
    success: true,
    company_id,
    generated_at: new Date().toISOString(),
    suggestions: (result.suggestions || []).map(s => ({
      product_a: s.product_a,
      product_b: s.product_b,
      product_a_name: productMap[s.product_a]?.name || `Product ${s.product_a}`,
      product_b_name: productMap[s.product_b]?.name || `Product ${s.product_b}`,
      affinity: s.affinity,
      suggestion: s.suggestion,
      expected_aov_lift_pct: s.expected_aov_lift_pct
    })),
    bundles: (result.bundles || []).map(b => ({
      products: b.products,
      product_names: (b.products || []).map(id => productMap[id]?.name || `Product ${id}`),
      label: b.label,
      expected_aov_lift_pct: b.expected_aov_lift_pct
    }))
  };

  await setCachedCrossSell(params, response);
  return response;
};

/**
 * Get product-specific cross-sell
 */
const getProductCrossSell = async (params = {}) => {
  const { product_id, company_id } = params;
  if (!product_id || !company_id) throw new Error('Product ID and Company ID are required');
  const all = await generateCrossSell(params);
  const relevant = (all.suggestions || []).filter(x => x.product_a === product_id || x.product_b === product_id);
  return { ...all, suggestions: relevant };
};

module.exports = {
  generateCrossSell,
  getProductCrossSell,
  generateCacheKey,
  getCachedCrossSell,
  setCachedCrossSell
};


