'use strict';

const productService = require('../services/productService');
const activityTrack = require('../utils/activityTrack');

/**
 * Product Controller
 * Handles HTTP requests for product operations
 */
class ProductController {
  /**
   * Get all products
   * GET /api/products
   */
  static async getAllProducts(req, res) {
    try {
      const { page, limit, search, company_id, category_id, sortBy, sortOrder } = req.query;
      
      const result = await productService.list({
        page,
        limit,
        search,
        company_id,
        category_id,
        sortBy,
        sortOrder
      });

      res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving products'
      });
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await productService.getById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Log view activity
      try {
        await activityTrack.viewed('product', id, { userId: req.user?.user_id });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Product retrieved successfully',
        data: product
      });
    } catch (error) {
      console.error('Get product by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving product'
      });
    }
  }

  /**
   * Create new product
   * POST /api/products
   */
  static async createProduct(req, res) {
    try {
      const { company_id, category_id, sku, name, description, unit, cost_price, selling_price, image } = req.body;

      // Basic validation
      if (!company_id || !name) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and product name are required'
        });
      }

      // Validate prices if provided
      if (cost_price !== undefined && cost_price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cost price must be greater than or equal to 0'
        });
      }

      if (selling_price !== undefined && selling_price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Selling price must be greater than or equal to 0'
        });
      }

      // Handle image upload - if file was uploaded, use the file path, otherwise use the image URL from body
      let imagePath = image;
      if (req.file) {
        // Construct the URL path for the uploaded file
        imagePath = `/uploads/products/${req.file.filename}`;
      }

      const product = await productService.create({
        company_id,
        category_id,
        sku,
        name,
        description,
        unit,
        cost_price,
        selling_price,
        image: imagePath
      });

      // Log create activity
      try {
        await activityTrack.created('product', product.product_id, {
          userId: req.user?.user_id,
          description: { company_id, name, sku }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      console.error('Create product error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required') ||
          error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating product',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update product
   * PUT /api/products/:id
   */
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { category_id, sku, name, description, unit, cost_price, selling_price, image } = req.body;

      // Check if product exists
      const existingProduct = await productService.getById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Validate prices if provided
      if (cost_price !== undefined && cost_price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cost price must be greater than or equal to 0'
        });
      }

      if (selling_price !== undefined && selling_price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Selling price must be greater than or equal to 0'
        });
      }

      // Handle image upload - if file was uploaded, use the file path, otherwise use the image URL from body
      let imagePath = image;
      if (req.file) {
        // Construct the URL path for the uploaded file
        imagePath = `/uploads/products/${req.file.filename}`;
        
        // Delete old image file if it exists and is in the uploads folder
        if (existingProduct.image && existingProduct.image.startsWith('/uploads/products/')) {
          const fs = require('fs');
          const path = require('path');
          const oldImagePath = path.join(__dirname, '..', existingProduct.image);
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (err) {
            console.error('Error deleting old image:', err);
            // Non-blocking - continue with update even if old image deletion fails
          }
        }
      }

      // Prepare update data (only include defined fields)
      const updateData = {};
      if (category_id !== undefined) updateData.category_id = category_id;
      if (sku !== undefined) updateData.sku = sku;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (unit !== undefined) updateData.unit = unit;
      if (cost_price !== undefined) updateData.cost_price = cost_price;
      if (selling_price !== undefined) updateData.selling_price = selling_price;
      if (imagePath !== undefined) updateData.image = imagePath;

      const product = await productService.update(id, updateData);

      // Log update activity
      try {
        await activityTrack.updated('product', id, {
          userId: req.user?.user_id,
          description: updateData
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      console.error('Update product error:', error);
      
      if (error.message.includes('Validation') || 
          error.message.includes('required') ||
          error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating product'
      });
    }
  }

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await productService.getById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Delete associated image file if it exists and is in the uploads folder
      if (product.image && product.image.startsWith('/uploads/products/')) {
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(__dirname, '..', product.image);
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (err) {
          console.error('Error deleting product image:', err);
          // Non-blocking - continue with deletion even if image deletion fails
        }
      }

      await productService.delete(id);

      // Log delete activity
      try {
        await activityTrack.deleted('product', id, {
          userId: req.user?.user_id,
          description: { name: product.name, sku: product.sku }
        });
      } catch (e) {
        // non-blocking
      }

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting product'
      });
    }
  }

  /**
   * Get all products for dropdown (no pagination)
   * GET /api/products/dropdown/all
   */
  static async getProductsForDropdown(req, res) {
    try {
      const { company_id, category_id, search, location_id } = req.query;
      
      // Default company_id to 1 if not provided
      const finalCompanyId = company_id || 1;
      const parsedLocationId = location_id !== undefined ? parseInt(location_id, 10) : undefined;
      
      const products = await productService.getAllForDropdown({
        company_id: finalCompanyId,
        category_id,
        search,
        location_id: Number.isFinite(parsedLocationId) ? parsedLocationId : undefined
      });

      res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        data: products
      });
    } catch (error) {
      console.error('Get products for dropdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving products for dropdown'
      });
    }
  }
}

module.exports = ProductController;

