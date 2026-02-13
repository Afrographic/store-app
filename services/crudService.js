'use strict';

const { Op } = require('sequelize');

/**
 * Generic CRUD Service for Sequelize models
 * Provides reusable CRUD operations with pagination, search, and filtering
 */
class CrudService {
  constructor(model, options = {}) {
    this.model = model;
    this.options = {
      // Default search fields - can be overridden per model
      searchFields: options.searchFields || [],
      // Default sort field
      defaultSort: options.defaultSort || 'created_at',
      // Default sort order
      defaultOrder: options.defaultOrder || 'DESC',
      // Default page size
      defaultPageSize: options.defaultPageSize || 10,
      // Maximum page size
      maxPageSize: options.maxPageSize || 100,
      // Fields to exclude from search
      excludeFromSearch: options.excludeFromSearch || ['password_hash', 'created_at', 'updated_at'],
      // Include associations by default
      defaultIncludes: options.defaultIncludes || [],
      // Fields to exclude from response
      excludeFromResponse: options.excludeFromResponse || ['password_hash'],
      ...options
    };
  }

  /**
   * Get paginated list with search and filtering
   * @param {Object} queryParams - Query parameters from request
   * @param {Object} additionalOptions - Additional Sequelize options
   * @returns {Object} Paginated result with data and metadata
   */
  async list(queryParams = {}, additionalOptions = {}) {
    try {
      const {
        page = 1,
        limit = this.options.defaultPageSize,
        search = '',
        sortBy = this.options.defaultSort,
        sortOrder = this.options.defaultOrder,
        ...filters
      } = queryParams;

      // Validate and sanitize pagination parameters
      const pageNumber = Math.max(1, parseInt(page, 10));
      const pageSize = Math.min(
        this.options.maxPageSize,
        Math.max(1, parseInt(limit, 10))
      );
      const offset = (pageNumber - 1) * pageSize;

      // Build where clause
      const whereClause = this._buildWhereClause(filters, search);

      // Build order clause
      const orderClause = this._buildOrderClause(sortBy, sortOrder);

      // Build include clause
      const includeClause = this._buildIncludeClause(additionalOptions.include);

      // Execute query
      const { count, rows } = await this.model.findAndCountAll({
        where: whereClause,
        include: includeClause,
        order: orderClause,
        limit: pageSize,
        offset: offset,
        distinct: true,
        ...additionalOptions
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / pageSize);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      // Remove sensitive fields from response
      const sanitizedRows = this._sanitizeResponse(rows);

      return {
        data: sanitizedRows,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: count,
          itemsPerPage: pageSize,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          search,
          sortBy,
          sortOrder,
          appliedFilters: filters
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch ${this.model.name} list: ${error.message}`);
    }
  }

  /**
   * Get single record by ID
   * @param {number|string} id - Record ID
   * @param {Object} additionalOptions - Additional Sequelize options
   * @returns {Object|null} Record data or null if not found
   */
  async getById(id, additionalOptions = {}) {
    try {
      const includeClause = this._buildIncludeClause(additionalOptions.include);

      const record = await this.model.findByPk(id, {
        include: includeClause,
        ...additionalOptions
      });

      if (!record) {
        return null;
      }

      return this._sanitizeResponse(record);
    } catch (error) {
      throw new Error(`Failed to fetch ${this.model.name} by ID: ${error.message}`);
    }
  }

  /**
   * Create new record
   * @param {Object} data - Record data
   * @param {Object} additionalOptions - Additional Sequelize options
   * @returns {Object} Created record
   */
  async create(data, additionalOptions = {}) {
    try {
      const record = await this.model.create(data, additionalOptions);
      return this._sanitizeResponse(record);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        const fields = error.errors.map(err => err.path).join(', ');
        const fieldValues = error.errors.map(err => `${err.path}: '${err.value}'`).join(', ');
        throw new Error(`A record with this ${fields} already exists (${fieldValues})`);
      }
      throw new Error(`Failed to create ${this.model.name}: ${error.message}`);
    }
  }

  /**
   * Update record by ID
   * @param {number|string} id - Record ID
   * @param {Object} data - Update data
   * @param {Object} additionalOptions - Additional Sequelize options
   * @returns {Object|null} Updated record or null if not found
   */
  async update(id, data, additionalOptions = {}) {
    try {
      const [affectedCount] = await this.model.update(data, {
        where: { [this._getPrimaryKey()]: id },
        ...additionalOptions
      });

      if (affectedCount === 0) {
        return null;
      }

      // Return updated record
      return await this.getById(id, additionalOptions);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        const fields = error.errors.map(err => err.path).join(', ');
        const fieldValues = error.errors.map(err => `${err.path}: '${err.value}'`).join(', ');
        throw new Error(`A record with this ${fields} already exists (${fieldValues})`);
      }
      throw new Error(`Failed to update ${this.model.name}: ${error.message}`);
    }
  }

  /**
   * Delete record by ID (hard delete)
   * @param {number|string} id - Record ID
   * @param {Object} additionalOptions - Additional Sequelize options
   * @returns {boolean} True if deleted, false if not found
   */
  async delete(id, additionalOptions = {}) {
    try {
      const deletedCount = await this.model.destroy({
        where: { [this._getPrimaryKey()]: id },
        ...additionalOptions
      });

      return deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete ${this.model.name}: ${error.message}`);
    }
  }

  /**
   * Check if record exists by ID
   * @param {number|string} id - Record ID
   * @returns {boolean} True if exists, false otherwise
   */
  async exists(id) {
    try {
      const count = await this.model.count({
        where: { [this._getPrimaryKey()]: id }
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to check ${this.model.name} existence: ${error.message}`);
    }
  }

  /**
   * Get count of records with optional filters
   * @param {Object} filters - Filter conditions
   * @returns {number} Count of records
   */
  async count(filters = {}) {
    try {
      const whereClause = this._buildWhereClause(filters);
      return await this.model.count({ where: whereClause });
    } catch (error) {
      throw new Error(`Failed to count ${this.model.name}: ${error.message}`);
    }
  }

  /**
   * Build where clause for search and filters
   * @private
   */
  _buildWhereClause(filters = {}, search = '') {
    const whereClause = {};

    // Add search conditions
    if (search && this.options.searchFields.length > 0) {
      const searchConditions = this.options.searchFields.map(field => ({
        [field]: {
          [Op.like]: `%${search}%`
        }
      }));
      whereClause[Op.or] = searchConditions;
    }

    // Add filter conditions
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        // Handle array values (for IN operations)
        if (Array.isArray(filters[key])) {
          whereClause[key] = { [Op.in]: filters[key] };
        } else {
          whereClause[key] = filters[key];
        }
      }
    });

    return whereClause;
  }

  /**
   * Build order clause
   * @private
   */
  _buildOrderClause(sortBy, sortOrder) {
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : this.options.defaultOrder;

    return [[sortBy, validSortOrder]];
  }

  /**
   * Build include clause for associations
   * @private
   */
  _buildIncludeClause(additionalIncludes = []) {
    const includes = [...this.options.defaultIncludes, ...additionalIncludes];
    return includes.length > 0 ? includes : undefined;
  }

  /**
   * Sanitize response by removing sensitive fields
   * @private
   */
  _sanitizeResponse(data) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this._sanitizeResponse(item));
    }

    if (data.dataValues) {
      const sanitized = { ...data.dataValues };
      this.options.excludeFromResponse.forEach(field => {
        delete sanitized[field];
      });
      return sanitized;
    }

    const sanitized = { ...data };
    this.options.excludeFromResponse.forEach(field => {
      delete sanitized[field];
    });
    return sanitized;
  }

  /**
   * Get primary key field name
   * @private
   */
  _getPrimaryKey() {
    return this.model.primaryKeyAttribute || 'id';
  }
}

module.exports = CrudService;
