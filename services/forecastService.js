'use strict';

const { Product, Inventory, Category, Location, aiReportCache, sequelize } = require('../model');
const openaiService = require('./openaiService');
const config = require('../config/config');

/**
 * Forecast Service
 * Provides AI-powered demand forecasting functionality
 * Uses OpenAI service for AI interactions
 */

/**
 * Get historical sales data for demand forecasting
 * @param {Object} filters - Filters for data retrieval (company_id, location_id, product_id, category_id, days)
 * @returns {Array} Historical sales data grouped by product and date
 */
const getHistoricalSalesData = async (filters = {}) => {
    try {
        const {
            company_id,
            location_id,
            product_id,
            category_id,
            days = 365 // Default to 1 year of historical data
        } = filters;

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Use raw SQL query for better performance and clarity
        const salesData = await sequelize.query(`
      SELECT 
        psi.product_id,
        DATE(ps.sale_date) AS date,
        SUM(psi.quantity) AS total_quantity,
        COUNT(DISTINCT ps.sale_id) AS order_count,
        AVG(psi.unit_price) AS avg_price,
        p.name as product_name,
        p.sku,
        p.category_id,
        c.name as category_name,
        p.selling_price,
        p.cost_price,
        ps.location_id,
        l.name as location_name
      FROM pos_sale_items psi
      INNER JOIN pos_sales ps ON psi.sale_id = ps.sale_id
      INNER JOIN products p ON psi.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN locations l ON ps.location_id = l.location_id
      WHERE ps.status = 'COMPLETED'
        AND ps.payment_status = 'PAID'
        AND ps.sale_date BETWEEN :startDate AND :endDate
        AND ps.company_id = p.company_id
        ${company_id ? 'AND ps.company_id = :company_id' : ''}
        ${location_id ? 'AND ps.location_id = :location_id' : ''}
        ${product_id ? 'AND psi.product_id = :product_id' : ''}
        ${category_id ? 'AND p.category_id = :category_id' : ''}
      GROUP BY psi.product_id, DATE(ps.sale_date), ps.location_id
      ORDER BY date ASC, psi.product_id ASC
    `, {
            replacements: {
                startDate,
                endDate,
                company_id: company_id || null,
                location_id: location_id || null,
                product_id: product_id || null,
                category_id: category_id || null
            },
            type: sequelize.QueryTypes.SELECT
        });

        // Format the results
        const formattedData = salesData.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name || 'Unknown',
            sku: item.sku || null,
            category_id: item.category_id || null,
            category_name: item.category_name || null,
            location_id: item.location_id || null,
            location_name: item.location_name || null,
            date: item.date,
            quantity: parseFloat(item.total_quantity || 0),
            order_count: parseInt(item.order_count || 0),
            avg_price: parseFloat(item.avg_price || 0),
            selling_price: parseFloat(item.selling_price || 0),
            cost_price: parseFloat(item.cost_price || 0)
        }));

        return formattedData;
    } catch (error) {
        throw new Error(`Error fetching historical sales data: ${error.message}`);
    }
};

/**
 * Get aggregated historical sales by product
 * @param {Object} filters - Filters for data retrieval
 * @returns {Array} Aggregated sales data by product
 */
const getAggregatedSalesData = async (filters = {}) => {
    try {
        const {
            company_id,
            location_id,
            product_id,
            category_id,
            days = 365
        } = filters;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get monthly aggregated data using raw query for better performance
        const salesByMonth = await sequelize.query(`
      SELECT 
        psi.product_id,
        DATE_FORMAT(ps.sale_date, '%Y-%m') AS month,
        SUM(psi.quantity) AS total_quantity,
        COUNT(DISTINCT ps.sale_id) AS order_count,
        AVG(psi.unit_price) AS avg_price,
        p.name as product_name,
        p.sku,
        p.category_id,
        c.name as category_name,
        p.selling_price,
        p.cost_price
      FROM pos_sale_items psi
      INNER JOIN pos_sales ps ON psi.sale_id = ps.sale_id
      INNER JOIN products p ON psi.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE ps.status = 'COMPLETED'
        AND ps.payment_status = 'PAID'
        AND ps.sale_date BETWEEN :startDate AND :endDate
        AND ps.company_id = p.company_id
        ${company_id ? 'AND ps.company_id = :company_id' : ''}
        ${location_id ? 'AND ps.location_id = :location_id' : ''}
        ${product_id ? 'AND psi.product_id = :product_id' : ''}
        ${category_id ? 'AND p.category_id = :category_id' : ''}
      GROUP BY psi.product_id, DATE_FORMAT(ps.sale_date, '%Y-%m')
      ORDER BY psi.product_id, month ASC
    `, {
            replacements: {
                startDate,
                endDate,
                company_id: company_id || null,
                location_id: location_id || null,
                product_id: product_id || null,
                category_id: category_id || null
            },
            type: sequelize.QueryTypes.SELECT
        });

        // Group by product
        const productSalesMap = {};
        salesByMonth.forEach(item => {
            const pid = item.product_id;
            if (!productSalesMap[pid]) {
                productSalesMap[pid] = {
                    product_id: pid,
                    product_name: item.product_name || 'Unknown',
                    sku: item.sku || null,
                    category_id: item.category_id || null,
                    category_name: item.category_name || null,
                    monthly_data: [],
                    total_quantity: 0,
                    total_orders: 0,
                    avg_price: 0,
                    selling_price: parseFloat(item.selling_price || 0),
                    cost_price: parseFloat(item.cost_price || 0)
                };
            }

            const quantity = parseFloat(item.total_quantity || 0);
            productSalesMap[pid].monthly_data.push({
                month: item.month,
                quantity: quantity,
                order_count: parseInt(item.order_count || 0),
                avg_price: parseFloat(item.avg_price || 0)
            });
            productSalesMap[pid].total_quantity += quantity;
            productSalesMap[pid].total_orders += parseInt(item.order_count || 0);
        });

        // Calculate averages
        Object.values(productSalesMap).forEach(product => {
            if (product.monthly_data.length > 0) {
                const prices = product.monthly_data.map(m => m.avg_price).filter(p => p > 0);
                product.avg_price = prices.length > 0
                    ? prices.reduce((a, b) => a + b, 0) / prices.length
                    : 0;
            }
        });

        return Object.values(productSalesMap);
    } catch (error) {
        throw new Error(`Error aggregating sales data: ${error.message}`);
    }
};

/**
 * Get current inventory levels for products
 * @param {Object} filters - Filters (company_id, location_id, product_id)
 * @returns {Array} Current inventory data
 */
const getCurrentInventory = async (filters = {}) => {
    try {
        const { company_id, location_id, product_id } = filters;

        const inventoryWhere = {};
        if (location_id) inventoryWhere.location_id = location_id;

        const productInclude = {
            model: Product,
            as: 'product',
            attributes: ['product_id', 'name', 'sku', 'category_id', 'company_id'],
            where: {}
        };

        if (company_id) productInclude.where.company_id = company_id;
        if (product_id) productInclude.where.product_id = product_id;

        const inventory = await Inventory.findAll({
            attributes: ['inventory_id', 'product_id', 'location_id', 'quantity', 'reserved_quantity'],
            where: inventoryWhere,
            include: [
                productInclude,
                {
                    model: Location,
                    as: 'location',
                    attributes: ['location_id', 'name']
                }
            ]
        });

        return inventory.map(item => ({
            product_id: item.product_id,
            product_name: item.product?.name || 'Unknown',
            location_id: item.location_id,
            location_name: item.location?.name || 'Unknown',
            current_quantity: parseFloat(item.quantity || 0),
            reserved_quantity: parseFloat(item.reserved_quantity || 0),
            available_quantity: parseFloat(item.quantity || 0) - parseFloat(item.reserved_quantity || 0)
        }));
    } catch (error) {
        throw new Error(`Error fetching inventory: ${error.message}`);
    }
};

/**
 * Generate a unique cache key based on forecast parameters
 */
const generateCacheKey = (params) => {
    const { company_id, location_id, product_id, category_id, historical_days } = params;
    return `forecast:${company_id}:${location_id || 'all'}:${product_id || 'all'}:${category_id || 'all'}:${historical_days}`;
};

/**
 * Get cached forecast if available and not expired
 */
const getCachedForecast = async (cacheKey) => {
    if (!config.aiReportCache.enabled) {
        return null;
    }

    try {
        const cacheEntry = await aiReportCache.findOne({
            where: { cache_key: cacheKey }
        });

        if (!cacheEntry) {
            return null;
        }

        // Check if expired
        if (new Date(cacheEntry.expires_at) < new Date()) {
            // Delete expired entry
            await cacheEntry.destroy();
            return null;
        }

        return cacheEntry.forecast_data;
    } catch (error) {
        console.error('Error fetching cached forecast:', error);
        return null;
    }
};

/**
 * Store forecast in cache
 */
const setCachedForecast = async (params, forecastData) => {
    if (!config.aiReportCache.enabled) {
        return;
    }

    try {
        const {
            company_id,
            location_id,
            product_id,
            category_id,
            historical_days
        } = params;

        const cacheKey = generateCacheKey(params);

        // Calculate expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + config.aiReportCache.ttl);

        // Use upsert to update if exists
        await aiReportCache.upsert({
            company_id,
            location_id,
            product_id,
            category_id,
            historical_days,
            cache_key: cacheKey,
            forecast_data: forecastData,
            expires_at: expiresAt
        });
    } catch (error) {
        console.error('Error caching forecast:', error);
        // Don't throw - caching is non-critical
    }
};

/**
 * Clean up expired cache entries (background job helper)
 */
const cleanupExpiredCache = async () => {
    try {
        const deletedCount = await aiReportCache.destroy({
            where: {
                expires_at: {
                    [sequelize.Sequelize.Op.lt]: new Date()
                }
            }
        });
        console.log(`Cleaned up ${deletedCount} expired forecast cache entries`);
        return deletedCount;
    } catch (error) {
        console.error('Error cleaning up expired cache:', error);
        return 0;
    }
};

/**
 * Generate demand forecast using OpenAI
 * @param {Object} params - Forecasting parameters
 * @param {number} params.company_id - Company ID
 * @param {number} params.location_id - Optional location ID
 * @param {number} params.product_id - Optional product ID
 * @param {number} params.category_id - Optional category ID
 * @param {number} params.historical_days - Days of historical data to analyze (default: 365)
 * @returns {Object} Demand forecast with 30/60/90 day predictions
 */
const generateDemandForecast = async (params = {}) => {
    try {
        const {
            company_id,
            location_id = null,
            product_id = null,
            category_id = null,
            historical_days = 365
        } = params;

        if (!company_id) {
            throw new Error('Company ID is required for demand forecasting');
        }

        // Check cache first
        const cacheKey = generateCacheKey(params);
        const cachedData = await getCachedForecast(cacheKey);
        if (cachedData) {
            console.log(`Returning cached forecast for key: ${cacheKey}`);
            return cachedData;
        }

        // Fetch historical sales data
        const salesData = await getAggregatedSalesData({
            company_id,
            location_id,
            product_id,
            category_id,
            days: historical_days
        });

        console.log({ salesData })

        if (!salesData || salesData.length === 0) {
            throw new Error('Insufficient historical data for demand forecasting');
        }

        // Get current inventory levels
        const inventoryData = await getCurrentInventory({
            company_id,
            location_id,
            product_id
        });

        // Create inventory map for quick lookup
        const inventoryMap = {};
        inventoryData.forEach(inv => {
            const key = `${inv.product_id}_${inv.location_id || 'all'}`;
            inventoryMap[key] = inv;
        });

        // Prepare minimal data for OpenAI analysis
        const productsToForecast = salesData.map(product => {
            // Calculate simple trend (latest month vs average)
            const months = product.monthly_data;
            const recentAvg = months.length > 0 ? months.slice(-3).reduce((sum, m) => sum + m.quantity, 0) / Math.min(3, months.length) : 0;
            const oldAvg = months.length > 3 ? months.slice(0, -3).reduce((sum, m) => sum + m.quantity, 0) / (months.length - 3) : 0;
            const trend = recentAvg > oldAvg * 1.1 ? 'UP' : recentAvg < oldAvg * 0.9 ? 'DOWN' : 'FLAT';

            return {
                id: product.product_id,
                name: product.product_name,
                sku: product.sku,
                cat: product.category_name,
                months: months.length,
                total: product.total_quantity,
                avg_monthly: product.total_quantity / Math.max(1, months.length),
                recent_avg: recentAvg,
                trend: trend,
                inv: inventoryMap[`${product.product_id}_${location_id || 'all'}`]?.available_quantity || 0
            };
        });

        // Limit to top 30 products by sales volume for API efficiency
        const topProducts = productsToForecast
            .sort((a, b) => b.total - a.total)
            .slice(0, 50);

        // Create minimal prompt for OpenAI
        const prompt = `Forecast demand for ${topProducts.length} products using historical data.

Data: ${JSON.stringify(topProducts)}

Return JSON:
{
  "forecasts": [
    {
      "product_id": number,
      "product_name": "string",
      "forecast_30": number,
      "forecast_60": number,
      "forecast_90": number,
      "confidence": "HIGH|MEDIUM|LOW",
      "risk": "STOCKOUT|OVERSTOCK|OK"
    }
  ],
  "summary": {
    "stockout_count": number,
    "overstock_count": number
  }
}

Extrapolate from avg_monthly and trend. Set risk: STOCKOUT if forecast > inv*1.5, OVERSTOCK if inv > forecast*3, else OK.`;

        // Use OpenAI service for chat completion
        const completion = await openaiService.chatCompletion(company_id, {
            model: openaiService.getDefaultModel(),
            messages: [
                {
                    role: 'system',
                    content: 'Return valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2, // Lower temperature for more consistent responses
            response_format: 'json_object'
        });

        // Parse the response
        let forecastResult;
        try {
            const content = completion.choices[0].message.content;
            forecastResult = JSON.parse(content);
        } catch (parseError) {
            throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
        }

        // Enhance forecast with additional calculated metrics
        const enhancedForecasts = forecastResult.forecasts.map(forecast => {
            const productData = topProducts.find(p => p.id === forecast.product_id);
            const inventoryInfo = inventoryMap[`${forecast.product_id}_${location_id || 'all'}`] || {};

            // Calculate days of inventory based on 30-day forecast
            const daily_forecast_30 = forecast.forecast_30 / 30;
            const days_of_inventory = daily_forecast_30 > 0
                ? Math.round((inventoryInfo.available_quantity || 0) / daily_forecast_30)
                : null;

            // Calculate reorder points
            const reorder_point = Math.ceil(forecast.forecast_30 * 1.2); // 20% safety buffer
            const recommended_reorder_qty = Math.max(0, reorder_point - (inventoryInfo.available_quantity || 0));

            return {
                product_id: forecast.product_id,
                product_name: forecast.product_name,
                sku: productData?.sku || null,
                category: productData?.cat || null,
                current_inventory: inventoryInfo.current_quantity || 0,
                available_inventory: inventoryInfo.available_quantity || 0,
                forecast_30_days: {
                    predicted_quantity: forecast.forecast_30,
                    daily_average: daily_forecast_30
                },
                forecast_60_days: {
                    predicted_quantity: forecast.forecast_60,
                    daily_average: forecast.forecast_60 / 60
                },
                forecast_90_days: {
                    predicted_quantity: forecast.forecast_90,
                    daily_average: forecast.forecast_90 / 90
                },
                confidence: forecast.confidence,
                risk_indicators: forecast.risk === 'STOCKOUT' ? ['STOCKOUT_RISK'] : forecast.risk === 'OVERSTOCK' ? ['OVERSTOCK_RISK'] : [],
                days_of_inventory: days_of_inventory,
                recommended_reorder_quantity: recommended_reorder_qty,
                reorder_point: reorder_point,
                historical_avg_monthly_sales: productData ? productData.avg_monthly : 0
            };
        });

        const result = {
            success: true,
            company_id,
            location_id,
            generated_at: new Date().toISOString(),
            historical_period_days: historical_days,
            forecasts: enhancedForecasts,
            summary: {
                total_products_analyzed: enhancedForecasts.length,
                products_with_stockout_risk: forecastResult.summary.stockout_count || 0,
                products_with_overstock_risk: forecastResult.summary.overstock_count || 0
            }
        };

        // Cache the result
        await setCachedForecast(params, result);

        return result;
    } catch (error) {
        throw new Error(`Error generating demand forecast: ${error.message}`);
    }
};

/**
 * Get demand forecast for specific product
 * @param {Object} params - Parameters including product_id and company_id
 * @returns {Object} Product-specific forecast
 */
const getProductForecast = async (params) => {
    const { product_id, company_id, location_id = null } = params;

    if (!product_id || !company_id) {
        throw new Error('Product ID and Company ID are required');
    }

    const forecast = await generateDemandForecast({
        company_id,
        location_id,
        product_id,
        historical_days: 365
    });

    // Return only the specific product forecast if found
    const productForecast = forecast.forecasts.find(f => f.product_id === product_id);

    if (!productForecast) {
        throw new Error('Insufficient data to generate forecast for this product');
    }

    return {
        ...forecast,
        forecast: productForecast
    };
};

/**
 * Get category-level demand forecast
 * @param {Object} params - Parameters including category_id and company_id
 * @returns {Object} Category-level forecast summary
 */
const getCategoryForecast = async (params) => {
    const { category_id, company_id, location_id = null } = params;

    if (!category_id || !company_id) {
        throw new Error('Category ID and Company ID are required');
    }

    const forecast = await generateDemandForecast({
        company_id,
        location_id,
        category_id,
        historical_days: 365
    });

    // Since generateDemandForecast already filters by category_id in the query,
    // all returned forecasts should be for the requested category
    // However, we'll double-check and return only matching forecasts
    const categoryForecasts = forecast.forecasts.filter(f => {
        // Check both category_id and category fields (category is the name string)
        const fCategoryId = f.category_id;
        return fCategoryId === category_id;
    });

    return {
        ...forecast,
        category_id,
        forecasts: categoryForecasts
    };
};

module.exports = {
    generateDemandForecast,
    getProductForecast,
    getCategoryForecast,
    getHistoricalSalesData,
    getAggregatedSalesData,
    getCurrentInventory,
    generateCacheKey,
    getCachedForecast,
    setCachedForecast,
    cleanupExpiredCache
};

