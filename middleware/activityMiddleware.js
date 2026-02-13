'use strict';

const { Log } = require('../model');

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

async function writeLog({ userId = null, action = null, entityType = null, entityId = null, description = null }) {
  const normalized = {
    user_id: userId != null ? Number(userId) : null,
    action: normalizeString(action),
    entity_type: normalizeString(entityType),
    entity_id: entityId != null ? Number(entityId) : null,
    description: toDescription(description)
  };
  return await Log.create(normalized);
}

// Express middleware factory to log requests
// Usage: app.use(activityMiddleware({ action: 'login', entityType: 'user' }))
function activityMiddleware({ action, entityType, entityIdFrom = 'params.id', descriptionFrom = null } = {}) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.user_id ?? null;

      let entityId = null;
      if (entityIdFrom) {
        const [root, key] = entityIdFrom.split('.');
        entityId = req[root]?.[key] ?? null;
      }

      let description = null;
      if (descriptionFrom) {
        try {
          if (descriptionFrom === 'body') description = req.body;
          else if (descriptionFrom === 'params') description = req.params;
          else if (descriptionFrom === 'query') description = req.query;
          else {
            const [root, key] = descriptionFrom.split('.');
            description = key ? req[root]?.[key] : req[root];
          }
        } catch (_) {}
      }

      await writeLog({ userId, action, entityType, entityId, description });
    } catch (err) {
      console.error('Activity middleware error:', err);
    } finally {
      next();
    }
  };
}

module.exports = { activityMiddleware };

