'use strict';

const { Product, Category, ProductPerformanceCache, sequelize } = require('../model');
const openaiService = require('./openaiService');
const config = require('../config/config');

/**
 * Product Performance Service
 * Provides AI-powered product performance analysis
 */

/**
 * Get sales performance data for products
 */
const getPerformanceData = async (filters = {}) => {
    try {
        const {
            company_id,
            location_id,
            category_id,
            days = 365
        } = filters;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const salesData = await sequelize.query(`
      SELECT 
        p.product_id,
        p.name AS product_name,
        p.sku,
        p.cost_price,
        p.selling_price,
        p.category_id,
        c.name AS category_name,
        COUNT(DISTINCT
          CASE
            WHEN ps.status = 'COMPLETED'
              AND ps.payment_status = 'PAID'
              AND ps.sale_date BETWEEN :startDate AND :endDate
              AND (:location_id IS NULL OR ps.location_id = :location_id)
            THEN ps.sale_id
            ELSE NULL
          END
        ) AS order_count,
        SUM(
          CASE
            WHEN ps.status = 'COMPLETED'
              AND ps.payment_status = 'PAID'
              AND ps.sale_date BETWEEN :startDate AND :endDate
              AND (:location_id IS NULL OR ps.location_id = :location_id)
            THEN COALESCE(psi.quantity, 0)
            ELSE 0
          END
        ) AS total_quantity,
        SUM(
          CASE
            WHEN ps.status = 'COMPLETED'
              AND ps.payment_status = 'PAID'
              AND ps.sale_date BETWEEN :startDate AND :endDate
              AND (:location_id IS NULL OR ps.location_id = :location_id)
            THEN COALESCE(psi.line_total, psi.quantity * psi.unit_price)
            ELSE 0
          END
        ) AS total_revenue,
        AVG(
          CASE
            WHEN ps.status = 'COMPLETED'
              AND ps.payment_status = 'PAID'
              AND ps.sale_date BETWEEN :startDate AND :endDate
              AND (:location_id IS NULL OR ps.location_id = :location_id)
            THEN psi.unit_price
            ELSE NULL
          END
        ) AS avg_price
      FROM products p
      LEFT JOIN pos_sale_items psi ON p.product_id = psi.product_id
      LEFT JOIN pos_sales ps ON psi.sale_id = ps.sale_id AND ps.company_id = :company_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.company_id = :company_id
        ${category_id ? 'AND p.category_id = :category_id' : ''}
      GROUP BY p.product_id, p.name, p.sku, p.cost_price, p.selling_price, p.category_id, c.name
      HAVING total_revenue > 0
      ORDER BY total_revenue DESC
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

        // Calculate performance metrics
        const totalRevenue = salesData.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);

        const performanceData = salesData.map(item => {
            const revenue = parseFloat(item.total_revenue || 0);
            const quantity = parseFloat(item.total_quantity || 0);
            const costPrice = parseFloat(item.cost_price || 0);
            const sellingPrice = parseFloat(item.selling_price || 0);
            const profit = (sellingPrice - costPrice) * quantity;
            const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
            
            return {
                product_id: item.product_id,
                product_name: item.product_name,
                sku: item.sku,
                category: item.category_name,
                revenue: revenue,
                profit: profit,
                margin: parseFloat(margin.toFixed(2)),
                quantity: quantity,
                order_count: parseInt(item.order_count || 0),
                revenue_pct: totalRevenue > 0 ? parseFloat(((revenue / totalRevenue) * 100).toFixed(2)) : 0,
                velocity: days > 0 ? parseFloat((quantity / days).toFixed(2)) : 0
            };
        });

        return performanceData;
    } catch (error) {
        throw new Error(`Error fetching performance data: ${error.message}`);
    }
};

/**
 * Generate cache key
 */
const generateCacheKey = (params) => {
    const { company_id, location_id, category_id, historical_days } = params;
    return `product_performance:${company_id}:${location_id || 'all'}:${category_id || 'all'}:${historical_days}`;
};

/**
 * Get cached performance data
 */
const getCachedPerformance = async (cacheKey) => {
    if (!config.aiReportCache.enabled) {
        return null;
    }

    try {
        const cacheEntry = await ProductPerformanceCache.findOne({
            where: { cache_key: cacheKey }
        });

        if (!cacheEntry) {
            return null;
        }

        if (new Date(cacheEntry.expires_at) < new Date()) {
            await cacheEntry.destroy();
            return null;
        }

        return cacheEntry.performance_data;
    } catch (error) {
        console.error('Error fetching cached performance:', error);
        return null;
    }
};

/**
 * Store performance data in cache
 */
const setCachedPerformance = async (params, performanceData) => {
    if (!config.aiReportCache.enabled) {
        return;
    }

    try {
        const { company_id, location_id, category_id, historical_days } = params;
        const cacheKey = generateCacheKey(params);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + config.aiReportCache.ttl);

        await ProductPerformanceCache.upsert({
            company_id,
            location_id,
            category_id,
            historical_days,
            cache_key: cacheKey,
            performance_data: performanceData,
            expires_at: expiresAt
        });
    } catch (error) {
        console.error('Error caching performance:', error);
    }
};

/**
 * Generate product performance analysis using AI
 */
const generateProductPerformanceAnalysis = async (params = {}) => {
    try {
        const {
            company_id,
            location_id = null,
            category_id = null,
            historical_days = 365
        } = params;

        if (!company_id) {
            throw new Error('Company ID is required');
        }

        // Check cache
        const cacheKey = generateCacheKey(params);
        const cachedData = await getCachedPerformance(cacheKey);
        if (cachedData) {
            console.log(`Returning cached performance for key: ${cacheKey}`);
            return cachedData;
        }

        // Fetch performance data
        const performanceData = await getPerformanceData({
            company_id,
            location_id,
            category_id,
            days: historical_days
        });

        if (!performanceData || performanceData.length === 0) {
            throw new Error('Insufficient performance data for analysis');
        }

        // Limit to top 50 products
        const topProducts = performanceData.slice(0, 50);

        // Create minimal AI prompt
        const prompt = `Analyze product performance for ${topProducts.length} products.

Data: ${JSON.stringify(topProducts)}

Return JSON:
{
  "performance": [
    {
      "product_id": number,
      "product_name": "string",
      "star_rating": "STAR|WINNER|AVERAGE|DUD",
      "profit_contribution": number,
      "roi_score": number,
      "recommendation": "string"
    }
  ],
  "insights": {
    "star_count": number,
    "dud_count": number,
    "top_profit_driver": "string",
    "resource_allocation_impact": "string"
  }
}

Classify: STAR (high profit+velocity), WINNER (high profit), AVERAGE (moderate), DUD (low profit+velocity).`;
        
        const completion = await openaiService.chatCompletion(company_id, {
            model: openaiService.getDefaultModel(),
            messages: [
                { role: 'system', content: 'Return valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            response_format: 'json_object'
        });

        let analysisResult;
        try {
            const content = completion.choices[0].message.content;
            analysisResult = JSON.parse(content);
        } catch (parseError) {
            throw new Error(`Failed to parse AI response: ${parseError.message}`);
        }

        // Merge AI insights with raw data
        const enhancedPerformance = performanceData.map(product => {
            const aiData = analysisResult.performance.find(p => p.product_id === product.product_id);
            return {
                ...product,
                star_rating: aiData?.star_rating || 'AVERAGE',
                profit_contribution_pct: aiData?.profit_contribution || 0,
                roi_score: aiData?.roi_score || 0,
                recommendation: aiData?.recommendation || ''
            };
        });

        const result = {
            success: true,
            company_id,
            location_id,
            category_id,
            generated_at: new Date().toISOString(),
            historical_period_days: historical_days,
            products: enhancedPerformance,
            insights: analysisResult.insights
        };

        await setCachedPerformance(params, result);
        return result;
    } catch (error) {
        throw new Error(`Error generating performance analysis: ${error.message}`);
    }
};

module.exports = {
    generateProductPerformanceAnalysis,
    getPerformanceData,
    generateCacheKey,
    getCachedPerformance,
    setCachedPerformance
};

