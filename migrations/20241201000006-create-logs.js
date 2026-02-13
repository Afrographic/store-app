'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('logs').catch(() => null);
    if (tableExists) {
      console.log('Logs table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('logs', {
      log_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('logs', ['user_id']);
    await queryInterface.addIndex('logs', ['action']);
    await queryInterface.addIndex('logs', ['entity_type']);
    await queryInterface.addIndex('logs', ['entity_id']);
    await queryInterface.addIndex('logs', ['created_at']);
    
    // Add composite index for common queries
    await queryInterface.addIndex('logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('logs', ['user_id', 'created_at']);
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('logs').catch(() => null);
    if (!tableExists) {
      console.log('Logs table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('logs');
  }
};
