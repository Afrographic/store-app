'use strict';

const { hasPermission } = require('../utils/permissions');

const ensureArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
};

const permissionMiddleware = (resource, action) => {
  if (!resource || !action) {
    throw new Error('permissionMiddleware requires both resource and action arguments');
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before permission check'
      });
    }

    const roleNames = ensureArray(req.user.roles)
      .filter(Boolean)
      .map(role => typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase());

    if (roleNames.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'User does not have any roles assigned'
      });
    }

    if (!hasPermission(roleNames, resource, action)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to ${action} ${resource}`
      });
    }

    return next();
  };
};

module.exports = permissionMiddleware;

