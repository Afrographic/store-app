'use strict';

const { Op } = require('sequelize');
const { sequelize, User, Category, Product, Supplier, StockMovement, Location, PosSale, PosTerminal } = require('../model');

/**
 * Get Admin dashboard statistics
 */
const getAdminStats = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get counts for all entities
    const [totalCategories, totalProducts, totalUsers, totalSuppliers, totalLocations, totalPosSales, totalTerminals] = await Promise.all([
      Category.count(),
      Product.count(),
      User.count(),
      Supplier.count(),
      Location.count(),
      PosSale.count(),
      PosTerminal.count()
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySalesAmount = await PosSale.sum('total_amount', {
      where: {
        status: 'COMPLETED',
        payment_status: 'PAID',
        sale_date: {
          [Op.between]: [startOfToday, endOfToday]
        }
      }
    }) || 0;

    const stats = {
      totalCategories,
      totalProducts,
      totalUsers,
      totalSuppliers,
      totalLocations,
      totalOrders: totalPosSales,
      totalTerminals,
      todaySalesAmount
    };

    res.json({
      success: true,
      message: 'Admin dashboard statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get Recent Activities
 */
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const limit = parseInt(req.query.limit) || 10;

    // Get recent stock movements (last 5)
    const recentStockMovements = await StockMovement.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'sku']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['username', 'full_name']
        }
      ],
      attributes: ['movement_id', 'movement_type', 'quantity', 'created_at']
    });

    const activities = {
      recentStockMovements: recentStockMovements.map(sm => ({
        id: sm.movement_id,
        movementType: sm.movement_type,
        quantity: sm.quantity,
        product: sm.product?.name || 'Unknown',
        sku: sm.product?.sku || 'N/A',
        createdBy: sm.creator?.full_name || sm.creator?.username || 'Unknown',
        createdAt: sm.created_at,
        type: 'stock_movement'
      }))
    };

    res.json({
      success: true,
      message: 'Recent stock movements retrieved successfully',
      data: activities
    });

  } catch (error) {
    console.error('Recent stock movements error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent stock movements',
      error: error.message
    });
  }
};

/**
 * Get Product Category Distribution
 */
const getCategoryDistribution = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get category distribution
    const categories = await Category.findAll({
      include: [
        {
          model: Product,
          as: 'products',
          attributes: []
        }
      ],
      attributes: [
        'category_id',
        'name',
        [Category.sequelize.fn('COUNT', Category.sequelize.col('products.product_id')), 'productCount']
      ],
      group: ['Category.category_id', 'Category.name'],
      raw: true
    });

    // Calculate total products
    const totalProducts = categories.reduce((sum, cat) => sum + parseInt(cat.productCount || 0), 0);

    // Calculate percentage for each category
    const distribution = categories.map(cat => ({
      categoryId: cat.category_id,
      categoryName: cat.name,
      productCount: parseInt(cat.productCount || 0),
      percentage: totalProducts > 0 ? ((parseInt(cat.productCount || 0) / totalProducts) * 100).toFixed(1) : 0
    }));

    // Sort by product count descending
    distribution.sort((a, b) => b.productCount - a.productCount);

    res.json({
      success: true,
      message: 'Category distribution retrieved successfully',
      data: {
        distribution,
        totalProducts
      }
    });

  } catch (error) {
    console.error('Category distribution error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category distribution',
      error: error.message
    });
  }
};

/**
 * Get Supplier Contribution
 * Based on orders from suppliers
 */
const getSupplierContribution = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const companyId = user.company_id || 1;

    const supplierRows = await sequelize.query(
      `
        SELECT
          s.supplier_id AS supplierId,
          s.name AS supplierName,
          COUNT(DISTINCT psi.sale_id) AS orderCount,
          SUM(psi.line_total) AS revenue
        FROM suppliers s
        INNER JOIN supplier_products sp ON sp.supplier_id = s.supplier_id
        INNER JOIN products p ON p.product_id = sp.product_id
        INNER JOIN pos_sale_items psi ON psi.product_id = p.product_id
        INNER JOIN pos_sales ps ON ps.sale_id = psi.sale_id
        WHERE s.company_id = :companyId
          AND sp.company_id = :companyId
          AND ps.status = 'COMPLETED'
          AND ps.payment_status = 'PAID'
        GROUP BY s.supplier_id, s.name
        HAVING orderCount > 0
        ORDER BY revenue DESC
      `,
      {
        replacements: { companyId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const totalOrders = supplierRows.reduce((sum, row) => sum + Number(row.orderCount || 0), 0);
    const totalRevenue = supplierRows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);

    const contribution = supplierRows.map((row) => {
      const orderCount = Number(row.orderCount || 0);
      const revenue = Number(row.revenue || 0);
      return {
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        orderCount,
        revenue: Number(revenue.toFixed(2)),
        percentage: totalOrders > 0 ? ((orderCount / totalOrders) * 100).toFixed(1) : '0.0',
        revenuePercentage: totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0.0'
      };
    });

    res.json({
      success: true,
      message: 'Supplier contribution retrieved successfully',
      data: {
        contribution,
        totalOrders,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Supplier contribution error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supplier contribution',
      error: error.message
    });
  }
};

module.exports = {
  getAdminStats,
  getRecentActivities,
  getCategoryDistribution,
  getSupplierContribution
};
