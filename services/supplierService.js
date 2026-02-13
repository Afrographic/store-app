'use strict';

const { createSupplierCrudService } = require('./crudServiceFactory');
const { Supplier } = require('../model');

// Service instance configured for Supplier
const supplierCrud = createSupplierCrudService();

module.exports = {
  list: (queryParams) => supplierCrud.list(queryParams, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  getById: (id) => supplierCrud.getById(id, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  create: (data) => supplierCrud.create(data),
  update: (id, data) => supplierCrud.update(id, data),
  delete: (id) => supplierCrud.delete(id),
  
  // Get all suppliers for dropdown (no pagination)
  getAllForDropdown: async (filters = {}) => {
    try {
      const where = {};
      
      // Apply optional filters
      if (filters.company_id) {
        where.company_id = filters.company_id;
      }

      const suppliers = await Supplier.findAll({
        where,
        attributes: ['supplier_id', 'name', 'email', 'phone'],
        order: [['name', 'ASC']],
        raw: true
      });

      return suppliers;
    } catch (error) {
      throw new Error(`Error fetching suppliers for dropdown: ${error.message}`);
    }
  }
};

