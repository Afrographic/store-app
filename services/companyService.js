'use strict';

const { createCompanyCrudService } = require('./crudServiceFactory');

// Service instance configured for Company
const companyCrud = createCompanyCrudService();

module.exports = {
  getById: (id) => companyCrud.getById(id),
  update: (id, data) => companyCrud.update(id, data),
};


