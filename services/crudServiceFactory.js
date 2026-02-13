'use strict';

const CrudService = require('./crudService');
const { User, Role, Company, File, Location, Supplier, Client, Category, Product, PaymentMethod, PosTerminal, PosSale } = require('../model');

/**
 * Factory function to create CRUD services for different models
 * Pre-configured with model-specific options
 */

// User CRUD Service Configuration
const createUserCrudService = () => {
  return new CrudService(User, {
    searchFields: ['username', 'email', 'full_name'],
    defaultSort: 'user_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['password_hash', 'created_at', 'updated_at'],
    defaultIncludes: [],
    excludeFromResponse: ['password_hash']
  });
};

// Role CRUD Service Configuration
const createRoleCrudService = () => {
  return new CrudService(Role, {
    searchFields: ['name', 'description'],
    defaultSort: 'role_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at', 'updated_at'],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// Company CRUD Service Configuration
const createCompanyCrudService = () => {
  return new CrudService(Company, {
    searchFields: ['name', 'email', 'phone', 'address'],
    defaultSort: 'created_at',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at', 'updated_at'],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// File CRUD Service Configuration
const createFileCrudService = () => {
  return new CrudService(File, {
    searchFields: ['file_url', 'alt_text'],
    defaultSort: 'created_at',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at'],
    defaultIncludes: [
      {
        model: require('../model').User,
        as: 'uploader',
        attributes: ['user_id', 'username', 'full_name', 'email']
      }
    ],
    excludeFromResponse: []
  });
};

// Location CRUD Service Configuration
const createLocationCrudService = () => {
  return new CrudService(Location, {
    searchFields: ['name', 'address', 'phone'],
    defaultSort: 'location_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at', 'updated_at'],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// Supplier CRUD Service Configuration
const createSupplierCrudService = () => {
  return new CrudService(Supplier, {
    searchFields: ['name', 'contact_name', 'email', 'phone', 'address'],
    defaultSort: 'supplier_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at', 'updated_at'],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// Client CRUD Service Configuration
const createClientCrudService = () => {
  return new CrudService(Client, {
    searchFields: ['name', 'contact_name', 'email', 'phone', 'address'],
    defaultSort: 'client_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at', 'updated_at'],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// Category CRUD Service Configuration
const createCategoryCrudService = () => {
  return new CrudService(Category, {
    searchFields: ['name', 'description'],
    defaultSort: 'category_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at', 'updated_at'],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// Product CRUD Service Configuration
const createProductCrudService = () => {
  return new CrudService(Product, {
    searchFields: ['name', 'description', 'sku'],
    defaultSort: 'product_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at', 'updated_at'],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// Payment Method CRUD Service Configuration
const createPaymentMethodCrudService = () => {
  return new CrudService(PaymentMethod, {
    searchFields: ['name', 'type'],
    defaultSort: 'payment_method_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: [],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// POS Terminal CRUD Service Configuration
const createPosTerminalCrudService = () => {
  return new CrudService(PosTerminal, {
    searchFields: ['terminal_name', 'status'],
    defaultSort: 'terminal_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: ['created_at'],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

// POS Sale CRUD Service Configuration
const createPosSaleCrudService = () => {
  return new CrudService(PosSale, {
    searchFields: ['invoice_number'],
    defaultSort: 'sale_id',
    defaultOrder: 'DESC',
    defaultPageSize: 10,
    maxPageSize: 100,
    excludeFromSearch: [],
    defaultIncludes: [],
    excludeFromResponse: []
  });
};

/**
 * Main factory function
 * @param {string} modelName - Name of the model
 * @returns {CrudService} Configured CRUD service instance
 */
const createCrudService = (modelName) => {
  const services = {
    User: createUserCrudService,
    Role: createRoleCrudService,
    Company: createCompanyCrudService,
    File: createFileCrudService,
    Location: createLocationCrudService,
    Supplier: createSupplierCrudService,
    Client: createClientCrudService,
    Category: createCategoryCrudService,
    Product: createProductCrudService,
    PaymentMethod: createPaymentMethodCrudService,
    PosTerminal: createPosTerminalCrudService,
    PosSale: createPosSaleCrudService
  };

  const serviceFactory = services[modelName];
  if (!serviceFactory) {
    throw new Error(`No CRUD service configuration found for model: ${modelName}`);
  }

  return serviceFactory();
};

module.exports = {
  createCrudService,
  createUserCrudService,
  createRoleCrudService,
  createCompanyCrudService,
  createFileCrudService,
  createLocationCrudService,
  createSupplierCrudService,
  createClientCrudService,
  createCategoryCrudService,
  createProductCrudService,
  createPaymentMethodCrudService,
  createPosTerminalCrudService,
  createPosSaleCrudService
};
