'use strict';

const { PERMISSIONS } = require('./constants');

const normalizeRoleName = (roleName = '') => roleName.toLowerCase();

const flattenPermissions = (permissions, prefix = '') => {
  const result = {};

  Object.entries(permissions || {}).forEach(([resource, value]) => {
    const resourceKey = prefix ? `${prefix}.${resource}` : resource;

    if (Array.isArray(value)) {
      result[resourceKey] = new Set(value);
      return;
    }

    if (value && typeof value === 'object') {
      Object.assign(result, flattenPermissions(value, resourceKey));
    }
  });

  return result;
};

const rolePermissionsCache = Object.entries(PERMISSIONS).reduce((acc, [roleName, permissions]) => {
  acc[normalizeRoleName(roleName)] = flattenPermissions(permissions);
  return acc;
}, {});

const mergePermissionMaps = (permissionMaps = []) => {
  return permissionMaps.reduce((acc, map) => {
    Object.entries(map).forEach(([resource, actions]) => {
      if (!acc[resource]) {
        acc[resource] = new Set();
      }

      actions.forEach(action => acc[resource].add(action));
    });

    return acc;
  }, {});
};

const getRolePermissions = (roleName) => {
  if (!roleName) {
    return {};
  }

  return rolePermissionsCache[normalizeRoleName(roleName)] || {};
};

const getPermissionsForRoles = (roleNames = []) => {
  const permissionMaps = roleNames
    .filter(Boolean)
    .map(name => getRolePermissions(name));

  const merged = mergePermissionMaps(permissionMaps);

  return Object.entries(merged).reduce((acc, [resource, actions]) => {
    acc[resource] = Array.from(actions);
    return acc;
  }, {});
};

const hasPermission = (roleNames = [], resource, action) => {
  if (!resource || !action) {
    return false;
  }

  const merged = mergePermissionMaps(
    roleNames.filter(Boolean).map(name => getRolePermissions(name))
  );

  const allowedActions = merged[resource];

  if (!allowedActions) {
    return false;
  }

  return allowedActions.has(action);
};

module.exports = {
  getRolePermissions,
  getPermissionsForRoles,
  hasPermission,
};

