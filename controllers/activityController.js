'use strict';

const { Log, User } = require('../model');
const { Op } = require('sequelize');

/**
 * Activity Controller
 * Handles HTTP requests for activity log operations
 */
class ActivityController {
  /**
   * Get all activities with pagination, search, and filters
   * GET /api/activities
   */
  static async getAllActivities(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        action = '',
        entity_type = '',
        user_id = ''
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};

      // Search in action, entity_type, or description
      if (search && search.trim() !== '') {
        whereClause[Op.or] = [
          { action: { [Op.like]: `%${search}%` } },
          { entity_type: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Filter by action
      if (action && action.trim() !== '') {
        whereClause.action = action;
      }

      // Filter by entity_type
      if (entity_type && entity_type.trim() !== '') {
        whereClause.entity_type = entity_type;
      }

      // Filter by user_id
      if (user_id && user_id.trim() !== '') {
        whereClause.user_id = parseInt(user_id);
      }

      // Get total count
      const totalCount = await Log.count({ where: whereClause });

      // Get activities with pagination
      const activities = await Log.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'username', 'email', 'full_name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Activities retrieved successfully',
        data: activities,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: totalPages
        }
      });
    } catch (error) {
      console.error('Get all activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving activities'
      });
    }
  }

  /**
   * Get activity by ID
   * GET /api/activities/:id
   */
  static async getActivityById(req, res) {
    try {
      const { id } = req.params;

      const activity = await Log.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'username', 'email', 'full_name'],
            required: false
          }
        ]
      });

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Activity retrieved successfully',
        data: activity
      });
    } catch (error) {
      console.error('Get activity by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving activity'
      });
    }
  }

  /**
   * Get unique actions for filter dropdown
   * GET /api/activities/filters/actions
   */
  static async getUniqueActions(req, res) {
    try {
      const actions = await Log.findAll({
        attributes: [
          [Log.sequelize.fn('DISTINCT', Log.sequelize.col('action')), 'action']
        ],
        where: {
          action: { [Op.ne]: null }
        },
        order: [['action', 'ASC']],
        raw: true
      });

      res.status(200).json({
        success: true,
        message: 'Unique actions retrieved successfully',
        data: actions.map(a => a.action)
      });
    } catch (error) {
      console.error('Get unique actions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving unique actions'
      });
    }
  }

  /**
   * Get unique entity types for filter dropdown
   * GET /api/activities/filters/entity-types
   */
  static async getUniqueEntityTypes(req, res) {
    try {
      const entityTypes = await Log.findAll({
        attributes: [
          [Log.sequelize.fn('DISTINCT', Log.sequelize.col('entity_type')), 'entity_type']
        ],
        where: {
          entity_type: { [Op.ne]: null }
        },
        order: [['entity_type', 'ASC']],
        raw: true
      });

      res.status(200).json({
        success: true,
        message: 'Unique entity types retrieved successfully',
        data: entityTypes.map(et => et.entity_type)
      });
    } catch (error) {
      console.error('Get unique entity types error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving unique entity types'
      });
    }
  }
}

module.exports = ActivityController;

