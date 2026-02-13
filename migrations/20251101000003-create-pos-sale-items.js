'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('pos_sale_items').catch(() => null);
    if (tableExists) {
      console.log('POS sale items table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('pos_sale_items', {
      item_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sale_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pos_sales',
          key: 'sale_id'
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
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      discount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      tax: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      line_total: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('pos_sale_items', ['sale_id'], {
      name: 'idx_item_sale'
    });
    await queryInterface.addIndex('pos_sale_items', ['product_id'], {
      name: 'idx_item_product'
    });
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('pos_sale_items').catch(() => null);
    if (!tableExists) {
      console.log('POS sale items table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('pos_sale_items');
  }
};

