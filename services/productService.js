'use strict';

const { createProductCrudService } = require('./crudServiceFactory');
const { Product } = require('../model');

// Service instance configured for Product
const productCrud = createProductCrudService();

module.exports = {
  list: (queryParams) => productCrud.list(queryParams, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      },
      {
        model: require('../model').Category,
        as: 'category',
        attributes: ['category_id', 'name']
      }
    ]
  }),
  getById: (id) => productCrud.getById(id, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      },
      {
        model: require('../model').Category,
        as: 'category',
        attributes: ['category_id', 'name']
      }
    ]
  }),
  create: (data) => productCrud.create(data),
  update: (id, data) => productCrud.update(id, data),
  delete: (id) => productCrud.delete(id),
  
  // Get all products for dropdown (no pagination)
  getAllForDropdown: async (filters = {}) => {
    try {
      const { Op } = require('sequelize');
      const where = {};
      
      // Apply optional filters
      if (filters.company_id) {
        where.company_id = filters.company_id;
      }
      if (filters.category_id) {
        where.category_id = filters.category_id;
      }
      if (filters.search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { sku: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const include = [
        {
          model: require('../model').Category,
          as: 'category',
          attributes: ['category_id', 'name'],
          required: false
        }
      ];

      const locationIdRaw = filters.location_id;
      const locationId = locationIdRaw !== undefined ? Number(locationIdRaw) : undefined;
      if (locationId !== undefined && !Number.isNaN(locationId)) {
        include.push({
          model: require('../model').Inventory,
          as: 'inventory',
          attributes: ['quantity'],
          where: {
            location_id: locationId,
            quantity: { [Op.gt]: 0 }
          },
          required: true
        });
      }

      const products = await Product.findAll({
        where,
        attributes: ['product_id', 'name', 'sku', 'unit', 'cost_price', 'selling_price', 'category_id', 'image'],
        include,
        order: [['name', 'ASC']],
        distinct: true
      });

      return products.map(product => {
        const productJson = product.toJSON();
        let availableQuantity;

        if (locationId !== undefined) {
          const inventoryEntry = Array.isArray(productJson.inventory)
            ? productJson.inventory[0]
            : productJson.inventory;
          if (inventoryEntry && inventoryEntry.quantity !== undefined && inventoryEntry.quantity !== null) {
            availableQuantity = parseFloat(inventoryEntry.quantity);
          } else {
            availableQuantity = 0;
          }
        }

        delete productJson.inventory;

        return {
          ...productJson,
          available_quantity: availableQuantity !== undefined ? Number(availableQuantity) : undefined
        };
      });
    } catch (error) {
      throw new Error(`Error fetching products for dropdown: ${error.message}`);
    }
  }
};

