'use strict';

const { createPosTerminalCrudService } = require('./crudServiceFactory');
const { PosTerminal } = require('../model');
const { Op } = require('sequelize');

// Service instance configured for PosTerminal
const posTerminalCrud = createPosTerminalCrudService();

module.exports = {
  list: async (queryParams) => {
    
    // Extract filters - separate company_id since it's not on pos_terminals table
    const { search, location_id, status, company_id, ...otherParams } = queryParams;
    
    // Build where clause for count (only for pos_terminals table fields)
    const whereClause = {};
    if (location_id) {
      whereClause.location_id = location_id;
    }
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { terminal_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Build location include with company filter if provided
    const locationInclude = {
      model: require('../model').Location,
      as: 'location',
      attributes: ['location_id', 'name', 'address'],
      ...(company_id && {
        where: {
          company_id: company_id
        }
      })
    };
    
    // Count terminals with location filter
    const totalCount = await PosTerminal.count({
      where: whereClause,
      include: company_id ? [locationInclude] : [],
      distinct: true,
      col: 'terminal_id'
    });

    // Remove company_id from queryParams before passing to crudService
    // since company_id is not a column in pos_terminals table
    const { company_id: _, ...paramsForCrud } = queryParams;

    // Call list with includes (without company_id in filters)
    const result = await posTerminalCrud.list(paramsForCrud, {
      include: [locationInclude]
    });

    // Override the count with our accurate count
    result.pagination.totalItems = totalCount;
    result.pagination.totalPages = Math.ceil(totalCount / result.pagination.itemsPerPage);
    
    console.log('POS Terminal service - Count:', totalCount, 'Result data length:', result.data?.length);
    
    return result;
  },
  getById: (id) => posTerminalCrud.getById(id, {
    include: [
      {
        model: require('../model').Location,
        as: 'location',
        attributes: ['location_id', 'name', 'address']
      }
    ]
  }),
  create: (data) => posTerminalCrud.create(data),
  update: (id, data) => posTerminalCrud.update(id, data),
  delete: (id) => posTerminalCrud.delete(id),
  
  // Get all terminals for dropdown (no pagination)
  getAllForDropdown: async (filters = {}) => {
    try {
      const where = {};
      
      // Apply optional filters
      if (filters.location_id) {
        where.location_id = filters.location_id;
      }
      if (filters.status) {
        where.status = filters.status;
      }

      const terminals = await PosTerminal.findAll({
        where,
        attributes: ['terminal_id', 'terminal_name', 'status'],
        order: [['terminal_name', 'ASC']],
        raw: true
      });

      return terminals;
    } catch (error) {
      throw new Error(`Error fetching POS terminals for dropdown: ${error.message}`);
    }
  }
};

