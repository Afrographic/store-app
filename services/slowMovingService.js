'use strict';

const { Product, Inventory, Category, Location, SlowMovingCache, sequelize } = require('../model');
const openaiService = require('./openaiService');
const config = require('../config/config');

// Fetch recent sales velocity and last sold date per product
const getVelocityAndAging = async (filters = {}) => {
  try {
    const {
      company_id,
      location_id,
      category_id,
      days = 180
    } = filters;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rows = await sequelize.query(`
      SELECT 
        p.product_id,
        p.name AS product_name,
        p.sku,
        p.category_id,
        c.name AS category_name,
        SUM(
          CASE 
            WHEN ps.status = 'COMPLETED'
              AND ps.payment_status = 'PAID'
              AND ps.sale_date BETWEEN :startDate AND :endDate
              AND (:location_id IS NULL OR ps.location_id = :location_id)
            THEN COALESCE(psi.quantity, 0)
            ELSE 0
          END
        ) AS sold_qty,
        MAX(
          CASE 
            WHEN ps.status = 'COMPLETED'
              AND ps.payment_status = 'PAID'
              AND ps.sale_date BETWEEN :startDate AND :endDate
              AND (:location_id IS NULL OR ps.location_id = :location_id)
            THEN ps.sale_date
            ELSE NULL
          END
        ) AS last_sold_at
      FROM products p
      LEFT JOIN pos_sale_items psi ON p.product_id = psi.product_id
      LEFT JOIN pos_sales ps ON psi.sale_id = ps.sale_id AND ps.company_id = :company_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.company_id = :company_id
        ${category_id ? 'AND p.category_id = :category_id' : ''}
      GROUP BY p.product_id, p.name, p.sku, p.category_id, c.name
    `, {
      replacements: {
        company_id,
        location_id: location_id || null,
        category_id: category_id || null,
        startDate,
        endDate
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Inventory
    const inventory = await Inventory.findAll({
      attributes: ['product_id', 'location_id', 'quantity', 'reserved_quantity'],
      include: [
        { model: Product, as: 'product', attributes: ['product_id', 'company_id'], where: { company_id } },
        { model: Location, as: 'location', attributes: ['location_id', 'name'], required: false }
      ],
      where: location_id ? { location_id } : {}
    });

    const invMap = new Map();
    inventory.forEach(i => {
      const key = i.product_id;
      const available = parseFloat(i.quantity || 0) - parseFloat(i.reserved_quantity || 0);
      invMap.set(key, (invMap.get(key) || 0) + available);
    });

    // Build metrics
    const metrics = rows.map(r => {
      const sold = parseFloat(r.sold_qty || 0);
      const daily_velocity = days > 0 ? sold / days : 0;
      const available = invMap.get(r.product_id) || 0;
      const days_of_inventory = daily_velocity > 0 ? Math.round(available / daily_velocity) : (available > 0 ? 9999 : 0);
      const lastSoldAt = r.last_sold_at ? new Date(r.last_sold_at) : null;
      const days_since_last_sale = lastSoldAt ? Math.ceil((endDate - lastSoldAt) / (1000 * 60 * 60 * 24)) : days;
      return {
        product_id: r.product_id,
        product_name: r.product_name,
        sku: r.sku,
        category: r.category_name,
        available,
        daily_velocity: parseFloat(daily_velocity.toFixed(2)),
        days_of_inventory,
        days_since_last_sale
      };
    });

    return metrics;
  } catch (error) {
    throw new Error(`Error computing velocity/aging: ${error.message}`);
  }
};

// Cache key generation
const generateCacheKey = (params) => {
  const { company_id, location_id, product_id, category_id, analysis_days } = params;
  return `slow_moving:${company_id}:${location_id || 'all'}:${product_id || 'all'}:${category_id || 'all'}:${analysis_days}`;
};

// Get cache
const getCachedAlerts = async (cacheKey) => {
  if (!config.aiReportCache.enabled) return null;
  try {
    const entry = await SlowMovingCache.findOne({ where: { cache_key: cacheKey } });
    if (!entry) return null;
    if (new Date(entry.expires_at) < new Date()) { await entry.destroy(); return null; }
    return entry.alert_data;
  } catch (e) {
    console.error('Error fetching slow-moving cache:', e);
    return null;
  }
};

// Set cache
const setCachedAlerts = async (params, data) => {
  if (!config.aiReportCache.enabled) return;
  try {
    const { company_id, location_id, product_id, category_id, analysis_days } = params;
    const cache_key = generateCacheKey(params);
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + config.aiReportCache.ttl);
    await SlowMovingCache.upsert({ company_id, location_id, product_id, category_id, analysis_days, cache_key, alert_data: data, expires_at });
  } catch (e) {
    console.error('Error caching slow-moving alerts:', e);
  }
};

// Generate slow-moving alerts using minimal-token AI prompt
const generateSlowMovingAlerts = async (params = {}) => {
  const {
    company_id,
    location_id = null,
    product_id = null,
    category_id = null,
    analysis_days = 180,
    threshold_days_of_inventory = 120,
    threshold_days_since_sale = 60
  } = params;

  if (!company_id) {
    throw new Error('Company ID is required');
  }

  // Cache
  const cacheKey = generateCacheKey(params);
  const cached = await getCachedAlerts(cacheKey);
  if (cached) return cached;

  // Compute metrics
  const metrics = await getVelocityAndAging({ company_id, location_id, category_id, days: analysis_days });
  let candidates = metrics.filter(m => (
    m.available > 0 && (
      m.days_of_inventory >= threshold_days_of_inventory ||
      m.days_since_last_sale >= threshold_days_since_sale ||
      m.daily_velocity === 0
    )
  ));

  // Optionally focus a single product
  if (product_id) {
    candidates = candidates.filter(c => c.product_id === product_id);
  }

  // Limit to 50 for token efficiency
  const top = candidates
    .sort((a, b) => (b.available - a.available))
    .slice(0, 50);

  if (top.length === 0) {
    const empty = { success: true, company_id, location_id, generated_at: new Date().toISOString(), analysis_days, alerts: [], summary: { count: 0, capital_locked: 0 } };
    await setCachedAlerts(params, empty);
    return empty;
  }

  // Minimal prompt (concise, JSON-only)
  const prompt = `Identify slow-moving inventory and clearance actions.
Data:${JSON.stringify(top)}
Return JSON:{"alerts":[{"product_id":n,"product_name":"s","risk":"SLOW|DEAD","days_of_inventory":n,"days_since_last_sale":n,"action":"markdown"}],"summary":{"count":n,"capital_locked":n}}`;

  const completion = await openaiService.chatCompletion(company_id, {
    model: openaiService.getDefaultModel(),
    messages: [
      { role: 'system', content: 'Return valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    response_format: 'json_object'
  });

  let ai;
  try {
    ai = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    throw new Error(`Failed to parse AI response: ${e.message}`);
  }

  // Merge/ensure fields and minimal structure
  const result = {
    success: true,
    company_id,
    location_id,
    generated_at: new Date().toISOString(),
    analysis_days,
    alerts: (ai.alerts || []).map(a => {
      const base = top.find(t => t.product_id === a.product_id);
      return {
        product_id: a.product_id,
        product_name: a.product_name || base?.product_name || '',
        sku: base?.sku || null,
        category: base?.category || null,
        available: base?.available || 0,
        days_of_inventory: a.days_of_inventory ?? base?.days_of_inventory ?? null,
        days_since_last_sale: a.days_since_last_sale ?? base?.days_since_last_sale ?? null,
        risk: a.risk || (base?.days_of_inventory >= (threshold_days_of_inventory * 2) ? 'DEAD' : 'SLOW'),
        action: a.action || 'Discount 20-40%, bundle, promote clearance.'
      };
    }),
    summary: ai.summary || { count: top.length, capital_locked: 0 }
  };

  await setCachedAlerts(params, result);
  return result;
};

module.exports = {
  generateSlowMovingAlerts,
  getVelocityAndAging,
  generateCacheKey,
  getCachedAlerts,
  setCachedAlerts
};


