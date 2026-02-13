'use strict';

const categoryService = require('../services/categoryService');
const activityTrack = require('../utils/activityTrack');

/**
 * Category Controller
 * Handles HTTP requests for category operations
 */
class CategoryController {
  /**
   * Get categories dropdown (no pagination)
   * GET /api/categories/dropdown
   */
  static async getCategoriesDropdown(req, res) {
    try {
      const { company_id } = req.query;

      // Basic validation
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      const categories = await categoryService.listAll({
        company_id,
        sortBy: 'name',
        sortOrder: 'ASC'
      });

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      console.error('Get categories dropdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving categories'
      });
    }
  }

  /**
   * Get all categories
   * GET /api/categories
   */
  static async getAllCategories(req, res) {
    try {
      const { page, limit, search, company_id, sortBy, sortOrder } = req.query;
      
      const result = await categoryService.list({
        page,
        limit,
        search,
        company_id,
        sortBy,
        sortOrder
      });

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving categories'
      });
    }
  }

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;

      const category = await categoryService.getById(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('category', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category
      });
    } catch (error) {
      console.error('Get category by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving category'
      });
    }
  }

  /**
   * Create new category
   * POST /api/categories
   */
  static async createCategory(req, res) {
    try {
      const { company_id, name, description } = req.body;

      // Basic validation
      if (!company_id || !name) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and category name are required'
        });
      }

      const category = await categoryService.create({
        company_id,
        name,
        description
      });

      // Log create activity
      try {
        await activityTrack.created('category', category.category_id, {
          userId: req.user?.user_id,
          description: { company_id, name, description }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      console.error('Create category error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating category'
      });
    }
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Check if category exists
      const existingCategory = await categoryService.getById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Prepare update data (only include defined fields)
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      const category = await categoryService.update(id, updateData);

      // Log update activity
      try {
        await activityTrack.updated('category', id, {
          userId: req.user?.user_id,
          description: updateData
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      console.error('Update category error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating category'
      });
    }
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await categoryService.getById(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      await categoryService.delete(id);

      // Log delete activity
      try {
        await activityTrack.deleted('category', id, {
          userId: req.user?.user_id,
          description: { name: category.name }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting category'
      });
    }
  }
}

module.exports = CategoryController;

