'use strict';

const Joi = require('joi');
const { VALIDATION, ENUMS } = require('./constants');

/**
 * Validation Schemas using Joi
 * Based on model definitions and database schema
 */

// ==========================================
// User Validation Schemas
// ==========================================
const userSchemas = {
  create: Joi.object({
    username: Joi.string()
      .min(VALIDATION.USERNAME_MIN_LENGTH)
      .max(VALIDATION.USERNAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Username is required',
        'string.min': `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`,
        'string.max': `Username must not exceed ${VALIDATION.USERNAME_MAX_LENGTH} characters`
      }),
    password: Joi.string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH)
      .max(VALIDATION.PASSWORD_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
        'string.max': `Password must not exceed ${VALIDATION.PASSWORD_MAX_LENGTH} characters`
      }),
    email: Joi.string()
      .email()
      .max(VALIDATION.EMAIL_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email must not exceed ${VALIDATION.EMAIL_MAX_LENGTH} characters`
      }),
    full_name: Joi.string()
      .min(VALIDATION.FULL_NAME_MIN_LENGTH)
      .max(VALIDATION.FULL_NAME_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.min': `Full name must be at least ${VALIDATION.FULL_NAME_MIN_LENGTH} characters`,
        'string.max': `Full name must not exceed ${VALIDATION.FULL_NAME_MAX_LENGTH} characters`
      }),
    company_id: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number'
      })
  }),

  update: Joi.object({
    username: Joi.string()
      .min(VALIDATION.USERNAME_MIN_LENGTH)
      .max(VALIDATION.USERNAME_MAX_LENGTH)
      .messages({
        'string.min': `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`,
        'string.max': `Username must not exceed ${VALIDATION.USERNAME_MAX_LENGTH} characters`
      }),
    password: Joi.string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH)
      .max(VALIDATION.PASSWORD_MAX_LENGTH)
      .messages({
        'string.min': `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
        'string.max': `Password must not exceed ${VALIDATION.PASSWORD_MAX_LENGTH} characters`
      }),
    email: Joi.string()
      .email()
      .max(VALIDATION.EMAIL_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email must not exceed ${VALIDATION.EMAIL_MAX_LENGTH} characters`
      }),
    full_name: Joi.string()
      .min(VALIDATION.FULL_NAME_MIN_LENGTH)
      .max(VALIDATION.FULL_NAME_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.min': `Full name must be at least ${VALIDATION.FULL_NAME_MIN_LENGTH} characters`,
        'string.max': `Full name must not exceed ${VALIDATION.FULL_NAME_MAX_LENGTH} characters`
      }),
    company_id: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number'
      })
  }).min(1),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  })
};

// ==========================================
// Company Validation Schemas
// ==========================================
const companySchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(VALIDATION.COMPANY_NAME_MIN_LENGTH)
      .max(VALIDATION.COMPANY_NAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Company name is required',
        'string.min': `Company name must be at least ${VALIDATION.COMPANY_NAME_MIN_LENGTH} characters`,
        'string.max': `Company name must not exceed ${VALIDATION.COMPANY_NAME_MAX_LENGTH} characters`
      }),
    email: Joi.string()
      .email()
      .max(VALIDATION.COMPANY_EMAIL_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email must not exceed ${VALIDATION.COMPANY_EMAIL_MAX_LENGTH} characters`
      }),
    phone: Joi.string()
      .max(VALIDATION.COMPANY_PHONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Phone must not exceed ${VALIDATION.COMPANY_PHONE_MAX_LENGTH} characters`
      }),
    address: Joi.string()
      .max(VALIDATION.COMPANY_ADDRESS_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Address is too long'
      }),
    logo_url: Joi.string()
      .uri()
      .max(VALIDATION.COMPANY_LOGO_URL_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.uri': 'Logo URL must be a valid URL',
        'string.max': `Logo URL must not exceed ${VALIDATION.COMPANY_LOGO_URL_MAX_LENGTH} characters`
      }),
    currency: Joi.string()
      .max(VALIDATION.COMPANY_CURRENCY_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Currency must not exceed ${VALIDATION.COMPANY_CURRENCY_MAX_LENGTH} characters`
      }),
    date_format: Joi.string()
      .max(VALIDATION.COMPANY_DATE_FORMAT_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Date format must not exceed ${VALIDATION.COMPANY_DATE_FORMAT_MAX_LENGTH} characters`
      }),
    timezone: Joi.string()
      .max(VALIDATION.COMPANY_TIMEZONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Timezone must not exceed ${VALIDATION.COMPANY_TIMEZONE_MAX_LENGTH} characters`
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(VALIDATION.COMPANY_NAME_MIN_LENGTH)
      .max(VALIDATION.COMPANY_NAME_MAX_LENGTH)
      .messages({
        'string.min': `Company name must be at least ${VALIDATION.COMPANY_NAME_MIN_LENGTH} characters`,
        'string.max': `Company name must not exceed ${VALIDATION.COMPANY_NAME_MAX_LENGTH} characters`
      }),
    email: Joi.string()
      .email()
      .max(VALIDATION.COMPANY_EMAIL_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email must not exceed ${VALIDATION.COMPANY_EMAIL_MAX_LENGTH} characters`
      }),
    phone: Joi.string()
      .max(VALIDATION.COMPANY_PHONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Phone must not exceed ${VALIDATION.COMPANY_PHONE_MAX_LENGTH} characters`
      }),
    address: Joi.string()
      .max(VALIDATION.COMPANY_ADDRESS_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Address is too long'
      }),
    logo_url: Joi.string()
      .uri()
      .max(VALIDATION.COMPANY_LOGO_URL_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.uri': 'Logo URL must be a valid URL',
        'string.max': `Logo URL must not exceed ${VALIDATION.COMPANY_LOGO_URL_MAX_LENGTH} characters`
      }),
    currency: Joi.string()
      .max(VALIDATION.COMPANY_CURRENCY_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Currency must not exceed ${VALIDATION.COMPANY_CURRENCY_MAX_LENGTH} characters`
      }),
    date_format: Joi.string()
      .max(VALIDATION.COMPANY_DATE_FORMAT_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Date format must not exceed ${VALIDATION.COMPANY_DATE_FORMAT_MAX_LENGTH} characters`
      }),
    timezone: Joi.string()
      .max(VALIDATION.COMPANY_TIMEZONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Timezone must not exceed ${VALIDATION.COMPANY_TIMEZONE_MAX_LENGTH} characters`
      })
  }).min(1)
};

// ==========================================
// Role Validation Schemas
// ==========================================
const roleSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(VALIDATION.ROLE_NAME_MIN_LENGTH)
      .max(VALIDATION.ROLE_NAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Role name is required',
        'string.min': `Role name must be at least ${VALIDATION.ROLE_NAME_MIN_LENGTH} characters`,
        'string.max': `Role name must not exceed ${VALIDATION.ROLE_NAME_MAX_LENGTH} characters`
      }),
    description: Joi.string()
      .max(VALIDATION.ROLE_DESCRIPTION_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Description must not exceed ${VALIDATION.ROLE_DESCRIPTION_MAX_LENGTH} characters`
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(VALIDATION.ROLE_NAME_MIN_LENGTH)
      .max(VALIDATION.ROLE_NAME_MAX_LENGTH)
      .messages({
        'string.min': `Role name must be at least ${VALIDATION.ROLE_NAME_MIN_LENGTH} characters`,
        'string.max': `Role name must not exceed ${VALIDATION.ROLE_NAME_MAX_LENGTH} characters`
      }),
    description: Joi.string()
      .max(VALIDATION.ROLE_DESCRIPTION_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Description must not exceed ${VALIDATION.ROLE_DESCRIPTION_MAX_LENGTH} characters`
      })
  }).min(1)
};

// Location Validation Schemas
// ==========================================
const locationSchemas = {
  create: Joi.object({
    company_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number',
        'any.required': 'Company ID is required'
      }),
    name: Joi.string()
      .min(VALIDATION.LOCATION_NAME_MIN_LENGTH)
      .max(VALIDATION.LOCATION_NAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Location name is required',
        'string.min': `Location name must be at least ${VALIDATION.LOCATION_NAME_MIN_LENGTH} characters`,
        'string.max': `Location name must not exceed ${VALIDATION.LOCATION_NAME_MAX_LENGTH} characters`
      }),
    address: Joi.string()
      .max(VALIDATION.LOCATION_ADDRESS_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Address is too long'
      }),
    phone: Joi.string()
      .max(VALIDATION.LOCATION_PHONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Phone must not exceed ${VALIDATION.LOCATION_PHONE_MAX_LENGTH} characters`
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(VALIDATION.LOCATION_NAME_MIN_LENGTH)
      .max(VALIDATION.LOCATION_NAME_MAX_LENGTH)
      .messages({
        'string.min': `Location name must be at least ${VALIDATION.LOCATION_NAME_MIN_LENGTH} characters`,
        'string.max': `Location name must not exceed ${VALIDATION.LOCATION_NAME_MAX_LENGTH} characters`
      }),
    address: Joi.string()
      .max(VALIDATION.LOCATION_ADDRESS_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Address is too long'
      }),
    phone: Joi.string()
      .max(VALIDATION.LOCATION_PHONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Phone must not exceed ${VALIDATION.LOCATION_PHONE_MAX_LENGTH} characters`
      })
  }).min(1)
};

// ==========================================
// Supplier Validation Schemas
// ==========================================
const supplierSchemas = {
  create: Joi.object({
    company_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number',
        'any.required': 'Company ID is required'
      }),
    name: Joi.string()
      .min(VALIDATION.SUPPLIER_NAME_MIN_LENGTH)
      .max(VALIDATION.SUPPLIER_NAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Supplier name is required',
        'string.min': `Supplier name must be at least ${VALIDATION.SUPPLIER_NAME_MIN_LENGTH} characters`,
        'string.max': `Supplier name must not exceed ${VALIDATION.SUPPLIER_NAME_MAX_LENGTH} characters`
      }),
    contact_name: Joi.string()
      .max(VALIDATION.SUPPLIER_CONTACT_NAME_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Contact name must not exceed ${VALIDATION.SUPPLIER_CONTACT_NAME_MAX_LENGTH} characters`
      }),
    email: Joi.string()
      .email()
      .max(VALIDATION.SUPPLIER_EMAIL_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email must not exceed ${VALIDATION.SUPPLIER_EMAIL_MAX_LENGTH} characters`
      }),
    phone: Joi.string()
      .max(VALIDATION.SUPPLIER_PHONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Phone must not exceed ${VALIDATION.SUPPLIER_PHONE_MAX_LENGTH} characters`
      }),
    address: Joi.string()
      .max(VALIDATION.SUPPLIER_ADDRESS_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Address is too long'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(VALIDATION.SUPPLIER_NAME_MIN_LENGTH)
      .max(VALIDATION.SUPPLIER_NAME_MAX_LENGTH)
      .messages({
        'string.min': `Supplier name must be at least ${VALIDATION.SUPPLIER_NAME_MIN_LENGTH} characters`,
        'string.max': `Supplier name must not exceed ${VALIDATION.SUPPLIER_NAME_MAX_LENGTH} characters`
      }),
    contact_name: Joi.string()
      .max(VALIDATION.SUPPLIER_CONTACT_NAME_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Contact name must not exceed ${VALIDATION.SUPPLIER_CONTACT_NAME_MAX_LENGTH} characters`
      }),
    email: Joi.string()
      .email()
      .max(VALIDATION.SUPPLIER_EMAIL_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email must not exceed ${VALIDATION.SUPPLIER_EMAIL_MAX_LENGTH} characters`
      }),
    phone: Joi.string()
      .max(VALIDATION.SUPPLIER_PHONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Phone must not exceed ${VALIDATION.SUPPLIER_PHONE_MAX_LENGTH} characters`
      }),
    address: Joi.string()
      .max(VALIDATION.SUPPLIER_ADDRESS_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Address is too long'
      })
  }).min(1)
};

// ==========================================
// Client Validation Schemas
// ==========================================
const clientSchemas = {
  create: Joi.object({
    company_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number',
        'any.required': 'Company ID is required'
      }),
    name: Joi.string()
      .min(VALIDATION.CLIENT_NAME_MIN_LENGTH)
      .max(VALIDATION.CLIENT_NAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Client name is required',
        'string.min': `Client name must be at least ${VALIDATION.CLIENT_NAME_MIN_LENGTH} characters`,
        'string.max': `Client name must not exceed ${VALIDATION.CLIENT_NAME_MAX_LENGTH} characters`
      }),
    contact_name: Joi.string()
      .max(VALIDATION.CLIENT_CONTACT_NAME_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Contact name must not exceed ${VALIDATION.CLIENT_CONTACT_NAME_MAX_LENGTH} characters`
      }),
    email: Joi.string()
      .max(VALIDATION.CLIENT_EMAIL_MAX_LENGTH)
      .allow(null, '')
      .custom((value, helpers) => {
        // Only validate email format if value is provided and not empty
        if (value && value.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return helpers.error('string.email');
          }
        }
        return value;
      })
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email must not exceed ${VALIDATION.CLIENT_EMAIL_MAX_LENGTH} characters`
      }),
    phone: Joi.string()
      .max(VALIDATION.CLIENT_PHONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Phone must not exceed ${VALIDATION.CLIENT_PHONE_MAX_LENGTH} characters`
      }),
    address: Joi.string()
      .max(VALIDATION.CLIENT_ADDRESS_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Address is too long'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(VALIDATION.CLIENT_NAME_MIN_LENGTH)
      .max(VALIDATION.CLIENT_NAME_MAX_LENGTH)
      .messages({
        'string.min': `Client name must be at least ${VALIDATION.CLIENT_NAME_MIN_LENGTH} characters`,
        'string.max': `Client name must not exceed ${VALIDATION.CLIENT_NAME_MAX_LENGTH} characters`
      }),
    contact_name: Joi.string()
      .max(VALIDATION.CLIENT_CONTACT_NAME_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Contact name must not exceed ${VALIDATION.CLIENT_CONTACT_NAME_MAX_LENGTH} characters`
      }),
    email: Joi.string()
      .max(VALIDATION.CLIENT_EMAIL_MAX_LENGTH)
      .allow(null, '')
      .custom((value, helpers) => {
        // Only validate email format if value is provided and not empty
        if (value && value.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return helpers.error('string.email');
          }
        }
        return value;
      })
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': `Email must not exceed ${VALIDATION.CLIENT_EMAIL_MAX_LENGTH} characters`
      }),
    phone: Joi.string()
      .max(VALIDATION.CLIENT_PHONE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Phone must not exceed ${VALIDATION.CLIENT_PHONE_MAX_LENGTH} characters`
      }),
    address: Joi.string()
      .max(VALIDATION.CLIENT_ADDRESS_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Address is too long'
      })
  }).min(1)
};

// ==========================================
// Category Validation Schemas
// ==========================================
const categorySchemas = {
  create: Joi.object({
    company_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number',
        'any.required': 'Company ID is required'
      }),
    name: Joi.string()
      .min(VALIDATION.CATEGORY_NAME_MIN_LENGTH)
      .max(VALIDATION.CATEGORY_NAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Category name is required',
        'string.min': `Category name must be at least ${VALIDATION.CATEGORY_NAME_MIN_LENGTH} characters`,
        'string.max': `Category name must not exceed ${VALIDATION.CATEGORY_NAME_MAX_LENGTH} characters`
      }),
    description: Joi.string()
      .max(VALIDATION.CATEGORY_DESCRIPTION_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Description is too long'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(VALIDATION.CATEGORY_NAME_MIN_LENGTH)
      .max(VALIDATION.CATEGORY_NAME_MAX_LENGTH)
      .messages({
        'string.min': `Category name must be at least ${VALIDATION.CATEGORY_NAME_MIN_LENGTH} characters`,
        'string.max': `Category name must not exceed ${VALIDATION.CATEGORY_NAME_MAX_LENGTH} characters`
      }),
    description: Joi.string()
      .max(VALIDATION.CATEGORY_DESCRIPTION_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Description is too long'
      })
  }).min(1)
};

// ==========================================
// Product Validation Schemas
// ==========================================
const productSchemas = {
  create: Joi.object({
    company_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number',
        'any.required': 'Company ID is required'
      }),
    category_id: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be a positive number'
      }),
    sku: Joi.string()
      .max(VALIDATION.PRODUCT_SKU_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `SKU must not exceed ${VALIDATION.PRODUCT_SKU_MAX_LENGTH} characters`
      }),
    name: Joi.string()
      .min(VALIDATION.PRODUCT_NAME_MIN_LENGTH)
      .max(VALIDATION.PRODUCT_NAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Product name is required',
        'string.min': `Product name must be at least ${VALIDATION.PRODUCT_NAME_MIN_LENGTH} characters`,
        'string.max': `Product name must not exceed ${VALIDATION.PRODUCT_NAME_MAX_LENGTH} characters`
      }),
    description: Joi.string()
      .max(VALIDATION.PRODUCT_DESCRIPTION_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Description is too long'
      }),
    unit: Joi.string()
      .max(VALIDATION.PRODUCT_UNIT_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Unit must not exceed ${VALIDATION.PRODUCT_UNIT_MAX_LENGTH} characters`
      }),
    cost_price: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .min(0)
      .allow(null)
      .messages({
        'number.base': 'Cost price must be a number',
        'number.min': 'Cost price must be greater than or equal to 0'
      }),
    selling_price: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .min(0)
      .allow(null)
      .messages({
        'number.base': 'Selling price must be a number',
        'number.min': 'Selling price must be greater than or equal to 0'
      })
  }),

  update: Joi.object({
    category_id: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be a positive number'
      }),
    sku: Joi.string()
      .max(VALIDATION.PRODUCT_SKU_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `SKU must not exceed ${VALIDATION.PRODUCT_SKU_MAX_LENGTH} characters`
      }),
    name: Joi.string()
      .min(VALIDATION.PRODUCT_NAME_MIN_LENGTH)
      .max(VALIDATION.PRODUCT_NAME_MAX_LENGTH)
      .messages({
        'string.min': `Product name must be at least ${VALIDATION.PRODUCT_NAME_MIN_LENGTH} characters`,
        'string.max': `Product name must not exceed ${VALIDATION.PRODUCT_NAME_MAX_LENGTH} characters`
      }),
    description: Joi.string()
      .max(VALIDATION.PRODUCT_DESCRIPTION_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Description is too long'
      }),
    unit: Joi.string()
      .max(VALIDATION.PRODUCT_UNIT_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Unit must not exceed ${VALIDATION.PRODUCT_UNIT_MAX_LENGTH} characters`
      }),
    cost_price: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .min(0)
      .allow(null)
      .messages({
        'number.base': 'Cost price must be a number',
        'number.min': 'Cost price must be greater than or equal to 0'
      }),
    selling_price: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .min(0)
      .allow(null)
      .messages({
        'number.base': 'Selling price must be a number',
        'number.min': 'Selling price must be greater than or equal to 0'
      })
  }).min(1)
};

// ==========================================
// Inventory Validation Schemas
// ==========================================
const inventorySchemas = {
  create: Joi.object({
    location_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Location ID must be a number',
        'number.integer': 'Location ID must be an integer',
        'number.positive': 'Location ID must be a positive number',
        'any.required': 'Location ID is required'
      }),
    product_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be a positive number',
        'any.required': 'Product ID is required'
      }),
    quantity: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .min(0)
      .allow(null)
      .messages({
        'number.base': 'Quantity must be a number',
        'number.min': 'Quantity must be greater than or equal to 0'
      }),
    reserved_quantity: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .min(0)
      .allow(null)
      .messages({
        'number.base': 'Reserved quantity must be a number',
        'number.min': 'Reserved quantity must be greater than or equal to 0'
      })
  }),

  update: Joi.object({
    quantity: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .min(0)
      .allow(null)
      .messages({
        'number.base': 'Quantity must be a number',
        'number.min': 'Quantity must be greater than or equal to 0'
      }),
    reserved_quantity: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .min(0)
      .allow(null)
      .messages({
        'number.base': 'Reserved quantity must be a number',
        'number.min': 'Reserved quantity must be greater than or equal to 0'
      })
  }).min(1)
};

// ==========================================
// Stock Movement Validation Schemas
// ==========================================
const stockMovementSchemas = {
  create: Joi.object({
    product_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be a positive number',
        'any.required': 'Product ID is required'
      }),
    location_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Location ID must be a number',
        'number.integer': 'Location ID must be an integer',
        'number.positive': 'Location ID must be a positive number',
        'any.required': 'Location ID is required'
      }),
    quantity: Joi.number()
      .precision(VALIDATION.DECIMAL_SCALE)
      .required()
      .messages({
        'number.base': 'Quantity must be a number',
        'any.required': 'Quantity is required'
      }),
    movement_type: Joi.string()
      .valid(...ENUMS.MOVEMENT_TYPE)
      .required()
      .messages({
        'any.only': `Movement type must be one of: ${ENUMS.MOVEMENT_TYPE.join(', ')}`,
        'any.required': 'Movement type is required'
      }),
    reference_id: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .messages({
        'number.base': 'Reference ID must be a number',
        'number.integer': 'Reference ID must be an integer',
        'number.positive': 'Reference ID must be a positive number'
      }),
    reference_type: Joi.string()
      .valid(...ENUMS.REFERENCE_TYPE)
      .allow(null)
      .messages({
        'any.only': `Reference type must be one of: ${ENUMS.REFERENCE_TYPE.join(', ')}`
      }),
    created_by: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .messages({
        'number.base': 'Created by must be a number',
        'number.integer': 'Created by must be an integer',
        'number.positive': 'Created by must be a positive number'
      })
  })
};

// ==========================================
// Order Validation Schemas
// ==========================================
const orderSchemas = {};

// ==========================================
// Order Item Validation Schemas
// ==========================================
const orderItemSchemas = {};

// ==========================================
// Setting Validation Schemas
// ==========================================
const settingSchemas = {
  create: Joi.object({
    company_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number',
        'any.required': 'Company ID is required'
      }),
    setting_key: Joi.string()
      .max(VALIDATION.SETTING_KEY_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Setting key is required',
        'string.max': `Setting key must not exceed ${VALIDATION.SETTING_KEY_MAX_LENGTH} characters`,
        'any.required': 'Setting key is required'
      }),
    setting_value: Joi.string()
      .max(VALIDATION.SETTING_VALUE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Setting value is too long'
      })
  }),

  update: Joi.object({
    setting_value: Joi.string()
      .max(VALIDATION.SETTING_VALUE_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': 'Setting value is too long'
      })
  })
};

// ==========================================
// File Validation Schemas
// ==========================================
const fileSchemas = {
  create: Joi.object({
    file_url: Joi.string()
      .uri()
      .min(VALIDATION.FILE_URL_MIN_LENGTH)
      .max(VALIDATION.FILE_URL_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'File URL is required',
        'string.uri': 'File URL must be a valid URL',
        'string.min': 'File URL is required',
        'string.max': `File URL must not exceed ${VALIDATION.FILE_URL_MAX_LENGTH} characters`,
        'any.required': 'File URL is required'
      }),
    alt_text: Joi.string()
      .max(VALIDATION.FILE_ALT_TEXT_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Alt text must not exceed ${VALIDATION.FILE_ALT_TEXT_MAX_LENGTH} characters`
      }),
    uploaded_by: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .messages({
        'number.base': 'Uploaded by must be a number',
        'number.integer': 'Uploaded by must be an integer',
        'number.positive': 'Uploaded by must be a positive number'
      })
  }),

  update: Joi.object({
    file_url: Joi.string()
      .uri()
      .min(VALIDATION.FILE_URL_MIN_LENGTH)
      .max(VALIDATION.FILE_URL_MAX_LENGTH)
      .messages({
        'string.uri': 'File URL must be a valid URL',
        'string.min': 'File URL is required',
        'string.max': `File URL must not exceed ${VALIDATION.FILE_URL_MAX_LENGTH} characters`
      }),
    alt_text: Joi.string()
      .max(VALIDATION.FILE_ALT_TEXT_MAX_LENGTH)
      .allow(null, '')
      .messages({
        'string.max': `Alt text must not exceed ${VALIDATION.FILE_ALT_TEXT_MAX_LENGTH} characters`
      })
  }).min(1)
};

// ==========================================
// Payment Method Validation Schemas
// ==========================================
const paymentMethodSchemas = {
  create: Joi.object({
    company_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Company ID must be a number',
        'number.integer': 'Company ID must be an integer',
        'number.positive': 'Company ID must be a positive number',
        'any.required': 'Company ID is required'
      }),
    name: Joi.string()
      .min(VALIDATION.PAYMENT_METHOD_NAME_MIN_LENGTH)
      .max(VALIDATION.PAYMENT_METHOD_NAME_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'Payment method name is required',
        'string.min': `Payment method name must be at least ${VALIDATION.PAYMENT_METHOD_NAME_MIN_LENGTH} characters`,
        'string.max': `Payment method name must not exceed ${VALIDATION.PAYMENT_METHOD_NAME_MAX_LENGTH} characters`
      }),
    type: Joi.string()
      .valid(...ENUMS.PAYMENT_METHOD_TYPE)
      .required()
      .messages({
        'any.only': `Payment method type must be one of: ${ENUMS.PAYMENT_METHOD_TYPE.join(', ')}`,
        'any.required': 'Payment method type is required'
      }),
    is_active: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'is_active must be a boolean value'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(VALIDATION.PAYMENT_METHOD_NAME_MIN_LENGTH)
      .max(VALIDATION.PAYMENT_METHOD_NAME_MAX_LENGTH)
      .messages({
        'string.min': `Payment method name must be at least ${VALIDATION.PAYMENT_METHOD_NAME_MIN_LENGTH} characters`,
        'string.max': `Payment method name must not exceed ${VALIDATION.PAYMENT_METHOD_NAME_MAX_LENGTH} characters`
      }),
    type: Joi.string()
      .valid(...ENUMS.PAYMENT_METHOD_TYPE)
      .messages({
        'any.only': `Payment method type must be one of: ${ENUMS.PAYMENT_METHOD_TYPE.join(', ')}`
      }),
    is_active: Joi.boolean()
      .messages({
        'boolean.base': 'is_active must be a boolean value'
      })
  }).min(1)
};

// Export all schemas
module.exports = {
  userSchemas,
  companySchemas,
  roleSchemas,
  locationSchemas,
  supplierSchemas,
  clientSchemas,
  categorySchemas,
  productSchemas,
  inventorySchemas,
  stockMovementSchemas,
  orderSchemas,
  orderItemSchemas,
  settingSchemas,
  fileSchemas,
  paymentMethodSchemas
};

