'use strict';

const { Log } = require('../model');
const { activityMiddleware } = require('../middleware/activityMiddleware');

// Normalize strings: trim and lower-case (when appropriate)
function normalizeString(value, { toLowerCase = true } = {}) {
  if (value == null) return value;
  const str = String(value).trim();
  return toLowerCase ? str.toLowerCase() : str;
}

// Build a safe description string (accept objects and stringify)
function toDescription(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch (_) {
    return String(value);
  }
}

// Core write helper
async function writeLog({ userId = null, action = null, entityType = null, entityId = null, description = null }) {
  // Coerce/normalize inputs; entityId/userId can be null
  const normalized = {
    user_id: userId != null ? Number(userId) : null,
    action: normalizeString(action),
    entity_type: normalizeString(entityType),
    entity_id: entityId != null ? Number(entityId) : null,
    description: toDescription(description)
  };

  return await Log.create(normalized);
}

// Public API
const ActivityTrack = {
  // Simple audit log creator
  async log(action, { userId = null, entityType = null, entityId = null, description = null } = {}) {
    return await writeLog({ userId, action, entityType, entityId, description });
  },

  // Convenience helpers for common actions
  async created(entityType, entityId, { userId = null, description = null } = {}) {
    return await writeLog({ userId, action: 'create', entityType, entityId, description });
  },

  async updated(entityType, entityId, { userId = null, description = null } = {}) {
    return await writeLog({ userId, action: 'update', entityType, entityId, description });
  },

  async deleted(entityType, entityId, { userId = null, description = null } = {}) {
    return await writeLog({ userId, action: 'delete', entityType, entityId, description });
  },

  async viewed(entityType, entityId, { userId = null, description = null } = {}) {
    return await writeLog({ userId, action: 'view', entityType, entityId, description });
  },

  // Re-export middleware factory
  middleware: activityMiddleware,
};

module.exports = ActivityTrack;
