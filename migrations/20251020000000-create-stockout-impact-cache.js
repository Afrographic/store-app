'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('stockout_impact_cache').catch(() => null);
    if (tableExists) {
      console.log('Stockout impact cache table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('stockout_impact_cache', {
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
        defaultValue: 90
      },
      cache_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Unique key identifying this cache entry'
      },
      impact_data: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Cached impact analysis results'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Cache expiration time'
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

    await queryInterface.addIndex('stockout_impact_cache', ['company_id']);
    await queryInterface.addIndex('stockout_impact_cache', ['cache_key']);
    await queryInterface.addIndex('stockout_impact_cache', ['expires_at']);
    await queryInterface.addIndex('stockout_impact_cache', ['company_id', 'location_id', 'product_id', 'category_id', 'analysis_days'], {
      name: 'idx_stockout_cache_composite'
    });
  },

  async down(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('stockout_impact_cache').catch(() => null);
    if (!tableExists) {
      console.log('Stockout impact cache table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('stockout_impact_cache');
  }
};

