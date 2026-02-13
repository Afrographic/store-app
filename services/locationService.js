'use strict';

const { createLocationCrudService } = require('./crudServiceFactory');
const { Location } = require('../model');
const { Op } = require('sequelize');

// Service instance configured for Location
const locationCrud = createLocationCrudService();

module.exports = {
  list: async (queryParams) => {
    
    // Extract filters for count query
    const { search, company_id, ...otherParams } = queryParams;
    
    // Build where clause for count
    const whereClause = {};
    if (company_id) {
      whereClause.company_id = company_id;
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Count locations separately to ensure accurate count
    const totalCount = await Location.count({
      where: whereClause,
      distinct: true,
      col: 'location_id'
    });
    
    // Get company include
    const companyInclude = {
      model: require('../model').Company,
      as: 'company',
      attributes: ['company_id', 'name']
    };

    // Call list with includes
    const result = await locationCrud.list(queryParams, {
      include: [companyInclude]
    });

    // Override the count with our accurate count
    result.pagination.totalItems = totalCount;
    result.pagination.totalPages = Math.ceil(totalCount / result.pagination.itemsPerPage);
    
    console.log('Location service - Count:', totalCount, 'Result data length:', result.data?.length);
    
    return result;
  },
  getById: (id) => locationCrud.getById(id, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  create: (data) => locationCrud.create(data),
  update: (id, data) => locationCrud.update(id, data),
  delete: (id) => locationCrud.delete(id),
  
  // Get all locations for dropdown (no pagination)
  getAllForDropdown: async (filters = {}) => {
    try {
      const where = {};
      
      // Apply optional filters
      if (filters.company_id) {
        where.company_id = filters.company_id;
      }

      const locations = await Location.findAll({
        where,
        attributes: ['location_id', 'name', 'address'],
        order: [['name', 'ASC']],
        raw: true
      });

      return locations;
    } catch (error) {
      throw new Error(`Error fetching locations for dropdown: ${error.message}`);
    }
  }
};

