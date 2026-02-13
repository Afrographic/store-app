'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('slow_moving_cache').catch(() => null);
    if (tableExists) {
      console.log('Slow moving cache table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('slow_moving_cache', {
      cache_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'company_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'location_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'category_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      analysis_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 180,
        comment: 'Days window used for velocity and aging analysis'
      },
      cache_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Unique key identifying this cache entry based on filters'
      },
      alert_data: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Cached slow-moving alerts as JSON'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When this cache entry expires'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Indexes
    await queryInterface.addIndex('slow_moving_cache', ['company_id']);
    await queryInterface.addIndex('slow_moving_cache', ['cache_key']);
    await queryInterface.addIndex('slow_moving_cache', ['expires_at']);
    await queryInterface.addIndex('slow_moving_cache', ['company_id', 'location_id', 'product_id', 'category_id', 'analysis_days'], {
      name: 'idx_slow_moving_cache_composite'
    });
  },

  async down(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('slow_moving_cache').catch(() => null);
    if (!tableExists) {
      console.log('Slow moving cache table does not exist, skipping rollback');
      return;
    }
    await queryInterface.dropTable('slow_moving_cache');
  }
};


