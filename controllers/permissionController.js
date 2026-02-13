'use strict';

const { PERMISSIONS } = require('../utils/constants');

/**
 * Get all permissions configuration
 * GET /api/permissions
 */
const getPermissions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: PERMISSIONS
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: error.message
    });
  }
};

module.exports = {
  getPermissions
};

