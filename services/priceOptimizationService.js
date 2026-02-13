'use strict';

const { Product, PriceOptimizationCache, sequelize } = require('../model');
const openaiService = require('./openaiService');
const config = require('../config/config');
const forecastService = require('./forecastService');

/**
 * Generate cache key
 */
const generateCacheKey = (params) => {
  const { company_id, location_id = null, product_id = null, category_id = null } = params;
  return `priceopt:${company_id}:${location_id || 'all'}:${product_id || 'all'}:${category_id || 'all'}`;
};

/**
 * Get cached result
 */
const getCachedOptimization = async (cacheKey) => {
  if (!config.aiReportCache?.enabled) return null;
  try {
    const entry = await PriceOptimizationCache.findOne({ where: { cache_key: cacheKey } });
    if (!entry) return null;
    if (new Date(entry.expires_at) < new Date()) {
      await entry.destroy();
      return null;
    }
    return entry.optimization_data;
  } catch (e) {
    return null;
  }
};

/**
 * Set cache
 */
const setCachedOptimization = async (params, data) => {
  if (!config.aiReportCache?.enabled) return;
  const { company_id, location_id = null, product_id = null, category_id = null } = params;
  const cache_key = generateCacheKey(params);
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + (config.aiReportCache.ttl || 1));
  await PriceOptimizationCache.upsert({
    company_id,
    location_id,
    product_id,
    category_id,
    cache_key,
    optimization_data: data,
    expires_at
  });
};

/**
 * Build compact input data for AI (minimal tokens)
 */
const buildProductSnapshots = async (params) => {
  const { company_id, location_id = null, product_id = null, category_id = null } = params;
  // Reuse aggregated monthly sales data from forecast service (keeps approach consistent)
  const sales = await forecastService.getAggregatedSalesData({
    company_id,
    location_id,
    product_id,
    category_id,
    days: 365
  });

  if (!sales || sales.length === 0) return [];

  // Snapshot with minimal fields needed for pricing logic
  const snapshots = sales.map(p => {
    const months = p.monthly_data || [];
    const last3 = months.slice(-3).map(m => m.avg_price || 0);
    const last3Qty = months.slice(-3).map(m => m.quantity || 0);
    const avgPrice = p.avg_price || 0;
    const recentAvgPrice = last3.length ? (last3.reduce((a, b) => a + b, 0) / last3.length) : avgPrice;
    const recentAvgQty = last3Qty.length ? (last3Qty.reduce((a, b) => a + b, 0) / last3Qty.length) : (p.total_quantity / Math.max(1, months.length));
    const margin = p.selling_price && p.cost_price ? (p.selling_price - p.cost_price) : (avgPrice - (p.cost_price || 0));
    return {
      id: p.product_id,
      name: p.product_name,
      sku: p.sku,
      price: p.selling_price || avgPrice || 0,
      cost: p.cost_price || 0,
      avg_price: avgPrice,
      recent_price: recentAvgPrice,
      avg_qty_mo: (p.total_quantity || 0) / Math.max(1, months.length),
      recent_qty_mo: recentAvgQty,
      margin
    };
  });

  // Limit to top 50 by revenue signal (price * recent_qty)
  return snapshots
    .sort((a, b) => (b.price * b.recent_qty_mo) - (a.price * a.recent_qty_mo))
    .slice(0, 50);
};

/**
 * Generate price optimization recommendations using OpenAI
 */
const generatePriceOptimization = async (params = {}) => {
  const { company_id } = params;
  if (!company_id) throw new Error('Company ID is required for price optimization');

  // cache check
  const cacheKey = generateCacheKey(params);
  const cached = await getCachedOptimization(cacheKey);
  if (cached) return cached;

  // build minimal dataset
  const products = await buildProductSnapshots(params);
  if (!products.length) throw new Error('Insufficient historical data for price optimization');

  // Minimal prompt for token efficiency
  const prompt = `Recommend prices to maximize profit without losing sales.
Data: ${JSON.stringify(products)}
Return JSON only:
{
  "recommendations": [
    { "product_id": number, "product_name": "string", "current_price": number, "recommended_price": number, "expected_revenue_change_pct": number, "elasticity_estimate": number, "note": "<=120 chars" }
  ],
  "summary": { "avg_change_pct": number, "underpriced_count": number }
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

  const response = {
    success: true,
    company_id: company_id,
    generated_at: new Date().toISOString(),
    recommendations: (result.recommendations || []).map(r => ({
      product_id: r.product_id,
      product_name: r.product_name,
      current_price: r.current_price,
      recommended_price: r.recommended_price,
      expected_revenue_change_pct: r.expected_revenue_change_pct,
      elasticity_estimate: r.elasticity_estimate,
      note: r.note
    })),
    summary: result.summary || {}
  };

  await setCachedOptimization(params, response);
  return response;
};

/**
 * Get single product price recommendation
 */
const getProductRecommendation = async (params = {}) => {
  const { product_id, company_id } = params;
  if (!product_id || !company_id) throw new Error('Product ID and Company ID are required');
  const all = await generatePriceOptimization(params);
  const rec = (all.recommendations || []).find(x => x.product_id === product_id);
  if (!rec) throw new Error('Insufficient data to generate recommendation for this product');
  return { ...all, recommendation: rec };
};

module.exports = {
  generatePriceOptimization,
  getProductRecommendation,
  generateCacheKey,
  getCachedOptimization,
  setCachedOptimization
};


