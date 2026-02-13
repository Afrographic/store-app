'use strict';

const { createPaymentMethodCrudService } = require('./crudServiceFactory');

// Service instance configured for PaymentMethod
const paymentMethodCrud = createPaymentMethodCrudService();

module.exports = {
  list: (queryParams) => paymentMethodCrud.list(queryParams, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  listAll: async (queryParams) => {
    // Get all payment methods without pagination for dropdown
    const { PaymentMethod } = require('../model');
    const { company_id, is_active, sortBy = 'name', sortOrder = 'ASC' } = queryParams;

    const whereClause = {};
    if (company_id) {
      whereClause.company_id = company_id;
    }
    if (is_active !== undefined) {
      whereClause.is_active = is_active === true || is_active === 'true';
    }

    const paymentMethods = await PaymentMethod.findAll({
      where: whereClause,
      attributes: ['payment_method_id', 'name', 'type', 'is_active'],
      order: [[sortBy, sortOrder]],
    });

    return paymentMethods;
  },
  getById: (id) => paymentMethodCrud.getById(id, {
    include: [
      {
        model: require('../model').Company,
        as: 'company',
        attributes: ['company_id', 'name']
      }
    ]
  }),
  create: (data) => paymentMethodCrud.create(data),
  update: (id, data) => paymentMethodCrud.update(id, data),
  delete: (id) => paymentMethodCrud.delete(id),
};

