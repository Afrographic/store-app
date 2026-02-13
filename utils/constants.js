"use strict";

/**
 * Application-wide constants
 * Contains validation rules, default values, and configuration constants
 */

// Validation constants
const VALIDATION = {
  // User validation
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 255,
  EMAIL_MAX_LENGTH: 255,
  FULL_NAME_MIN_LENGTH: 2,
  FULL_NAME_MAX_LENGTH: 255,

  // Company validation
  COMPANY_NAME_MIN_LENGTH: 1,
  COMPANY_NAME_MAX_LENGTH: 255,
  COMPANY_EMAIL_MAX_LENGTH: 255,
  COMPANY_PHONE_MAX_LENGTH: 50,
  COMPANY_ADDRESS_MAX_LENGTH: 65535,
  COMPANY_LOGO_URL_MAX_LENGTH: 255,
  COMPANY_CURRENCY_MAX_LENGTH: 10,
  COMPANY_DATE_FORMAT_MAX_LENGTH: 20,
  COMPANY_TIMEZONE_MAX_LENGTH: 50,

  // Role validation
  ROLE_NAME_MIN_LENGTH: 2,
  ROLE_NAME_MAX_LENGTH: 50,
  ROLE_DESCRIPTION_MAX_LENGTH: 255,

  // Location validation
  LOCATION_NAME_MIN_LENGTH: 1,
  LOCATION_NAME_MAX_LENGTH: 255,
  LOCATION_PHONE_MAX_LENGTH: 50,
  LOCATION_ADDRESS_MAX_LENGTH: 65535,

  // Supplier validation
  SUPPLIER_NAME_MIN_LENGTH: 1,
  SUPPLIER_NAME_MAX_LENGTH: 255,
  SUPPLIER_CONTACT_NAME_MAX_LENGTH: 255,
  SUPPLIER_EMAIL_MAX_LENGTH: 255,
  SUPPLIER_PHONE_MAX_LENGTH: 50,
  SUPPLIER_ADDRESS_MAX_LENGTH: 65535,

  // Client validation
  CLIENT_NAME_MIN_LENGTH: 1,
  CLIENT_NAME_MAX_LENGTH: 255,
  CLIENT_CONTACT_NAME_MAX_LENGTH: 255,
  CLIENT_EMAIL_MAX_LENGTH: 255,
  CLIENT_PHONE_MAX_LENGTH: 50,
  CLIENT_ADDRESS_MAX_LENGTH: 65535,

  // Category validation
  CATEGORY_NAME_MIN_LENGTH: 1,
  CATEGORY_NAME_MAX_LENGTH: 255,
  CATEGORY_DESCRIPTION_MAX_LENGTH: 65535,

  // Product validation
  PRODUCT_SKU_MAX_LENGTH: 50,
  PRODUCT_NAME_MIN_LENGTH: 1,
  PRODUCT_NAME_MAX_LENGTH: 255,
  PRODUCT_DESCRIPTION_MAX_LENGTH: 65535,
  PRODUCT_UNIT_MAX_LENGTH: 50,

  // Setting validation
  SETTING_KEY_MAX_LENGTH: 100,
  SETTING_VALUE_MAX_LENGTH: 65535,

  // Log validation
  LOG_ACTION_MAX_LENGTH: 255,
  LOG_ENTITY_TYPE_MAX_LENGTH: 50,
  LOG_DESCRIPTION_MAX_LENGTH: 65535,

  // File validation
  FILE_URL_MIN_LENGTH: 1,
  FILE_URL_MAX_LENGTH: 500,
  FILE_ALT_TEXT_MAX_LENGTH: 255,

  // Payment method validation
  PAYMENT_METHOD_NAME_MIN_LENGTH: 1,
  PAYMENT_METHOD_NAME_MAX_LENGTH: 100,

  // Decimal precision
  DECIMAL_PRECISION: 15,
  DECIMAL_SCALE: 2,
};

// Bcrypt configuration
const BCRYPT = {
  SALT_ROUNDS: 10,
};

// Default values
const DEFAULTS = {
  CURRENCY: "USD",
  DATE_FORMAT: "YYYY-MM-DD",
  TIMEZONE: "UTC",
  PRODUCT_UNIT: "pcs",
  QUANTITY: 0,
  RESERVED_QUANTITY: 0,
};

// Enum values
const ENUMS = {
  MOVEMENT_TYPE: ["IN", "OUT"],
  // Keep POS_RETURN for legacy compatibility, but DB enum uses ORDER_PURCHASE / ORDER_SELL
  REFERENCE_TYPE: [
    "ORDER_PURCHASE",
    "ORDER_SELL",
    "ADJUSTMENT",
    "TRANSFER",
    "OPENING_STOCK",
    "POS_SALE",
    "POS_RETURN",
  ],
  PAYMENT_METHOD_TYPE: ["CASH", "CARD", "UPI", "GPAY", "OTHER"],
  POS_PAYMENT_STATUS: ["PAID", "PENDING"],
  POS_SALE_STATUS: ["COMPLETED", "CANCELLED", "PENDING"],
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const SETTINGS_KEYS = {
  OPEN_AI: {
    KEY_LABEL: "OPEN AI API KEY",
    KEY_NAME: "open_ai_api_key",
  },
};

const PERMISSIONS = {
  admin: {
    dashboard: ["read"],
    posOrders: ["create", "read", "update", "delete"],
    posTerminals: ["create", "read", "update", "delete"],

    products: ["create", "read", "update", "delete"],
    stockMovement: ["create", "read", "update", "delete"],
    reservedQuantity: ["create", "read", "update", "delete"],

    categories: ["create", "read", "update", "delete"],
    locations: ["create", "read", "update", "delete"],

    clients: ["create", "read", "update", "delete"],
    suppliers: ["create", "read", "update", "delete"],

    paymentMethods: ["create", "read", "update", "delete"],

    reports: ["create", "read", "export"],
    aiReports: ["read"],

    users: ["create", "read", "update", "delete"],
    roles: ["create", "read", "update", "delete"],

    activities: ["read"],
    settings: {
      additionalSettings: ["read", "update"],
      organizationSettings: ["read", "update"],
    },
    profile: ["read", "update"],
  },
  cashier: {
    dashboard: ["read"],
    posOrders: ["create", "read", "update"],
    posTerminals: ["read"],

    // Allow cashiers to view payment methods (for POS payment dropdowns)
    paymentMethods: ["read"],

    products: ["read"],
    stockMovement: ["read"],

    categories: ["read"],
    locations: ["read"],

    clients: ["create", "read"],

    profile: ["read", "update"],
  },
};

module.exports = {
  PERMISSIONS,
  VALIDATION,
  BCRYPT,
  DEFAULTS,
  ENUMS,
  PAGINATION,
  SETTINGS_KEYS,
};
