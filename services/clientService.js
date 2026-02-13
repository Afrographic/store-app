'use strict';

const { createClientCrudService } = require('./crudServiceFactory');
const { Client } = require('../model');

// Service instance configured for Client
const clientCrud = createClientCrudService();

module.exports = {
  list: (queryParams) => clientCrud.list(queryParams, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  getById: (id) => clientCrud.getById(id, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  create: (data) => clientCrud.create(data),
  update: (id, data) => clientCrud.update(id, data),
  delete: (id) => clientCrud.delete(id),
  
  // Get all clients for dropdown (no pagination)
  getAllForDropdown: async (filters = {}) => {
    try {
      const where = {};
      
      // Apply optional filters
      if (filters.company_id) {
        where.company_id = filters.company_id;
      }

      const clients = await Client.findAll({
        where,
        attributes: ['client_id', 'name', 'email', 'phone'],
        order: [['name', 'ASC']],
        raw: true
      });

      return clients;
    } catch (error) {
      throw new Error(`Error fetching clients for dropdown: ${error.message}`);
    }
  }
};

