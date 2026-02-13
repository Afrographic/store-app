'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('stock_movements').catch(() => null);
    if (tableExists) {
      console.log('Stock movements table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('stock_movements', {
      movement_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'locations',
          key: 'location_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      movement_type: {
        type: Sequelize.ENUM('IN', 'OUT', 'TRANSFER'),
        allowNull: false
      },
      reference_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      reference_type: {
        type: Sequelize.ENUM('ORDER', 'ADJUSTMENT', 'TRANSFER'),
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('stock_movements', ['product_id']);
    await queryInterface.addIndex('stock_movements', ['location_id']);
    await queryInterface.addIndex('stock_movements', ['movement_type']);
    await queryInterface.addIndex('stock_movements', ['reference_id']);
    await queryInterface.addIndex('stock_movements', ['reference_type']);
    await queryInterface.addIndex('stock_movements', ['created_by']);
    await queryInterface.addIndex('stock_movements', ['created_at']);
    
    // Add composite indexes for common queries
    await queryInterface.addIndex('stock_movements', ['product_id', 'location_id']);
    await queryInterface.addIndex('stock_movements', ['movement_type', 'created_at']);
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('stock_movements').catch(() => null);
    if (!tableExists) {
      console.log('Stock movements table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('stock_movements');
  }
};
