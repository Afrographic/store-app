'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('inventory').catch(() => null);
    if (tableExists) {
      console.log('Inventory table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('inventory', {
      inventory_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      quantity: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
      },
      reserved_quantity: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
      },
      last_updated: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint for location_id and product_id combination
    await queryInterface.addIndex('inventory', ['location_id', 'product_id'], {
      unique: true,
      name: 'unique_location_product'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('inventory', ['location_id']);
    await queryInterface.addIndex('inventory', ['product_id']);
    await queryInterface.addIndex('inventory', ['last_updated']);
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('inventory').catch(() => null);
    if (!tableExists) {
      console.log('Inventory table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('inventory');
  }
};
