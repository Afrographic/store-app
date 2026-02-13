'use strict';

const { createCategoryCrudService } = require('./crudServiceFactory');

// Service instance configured for Category
const categoryCrud = createCategoryCrudService();

module.exports = {
  list: (queryParams) => categoryCrud.list(queryParams, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  listAll: async (queryParams) => {
    // Get all categories without pagination for dropdown
    const { Category } = require('../model');
    const { company_id, sortBy = 'name', sortOrder = 'ASC' } = queryParams;

    const whereClause = {};
    if (company_id) {
      whereClause.company_id = company_id;
    }

    const categories = await Category.findAll({
      where: whereClause,
      attributes: ['category_id', 'name', 'description'],
      order: [[sortBy, sortOrder]],
    });

    return categories;
  },
  getById: (id) => categoryCrud.getById(id, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  create: (data) => categoryCrud.create(data),
  update: (id, data) => categoryCrud.update(id, data),
  delete: (id) => categoryCrud.delete(id),
};

