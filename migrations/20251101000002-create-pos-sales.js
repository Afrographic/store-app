'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('pos_sales').catch(() => null);
    if (tableExists) {
      console.log('POS sales table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('pos_sales', {
      sale_id: {
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
        allowNull: false,
        references: {
          model: 'locations',
          key: 'location_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      terminal_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'pos_terminals',
          key: 'terminal_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clients',
          key: 'client_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      cashier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      sale_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      subtotal: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
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
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      payment_method_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'payment_methods',
          key: 'payment_method_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      payment_status: {
        type: Sequelize.ENUM('PAID', 'PENDING'),
        allowNull: false,
        defaultValue: 'PAID'
      },
      status: {
        type: Sequelize.ENUM('COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'COMPLETED'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('pos_sales', ['sale_date'], {
      name: 'idx_sale_date'
    });
    await queryInterface.addIndex('pos_sales', ['location_id'], {
      name: 'idx_sale_location'
    });
    await queryInterface.addIndex('pos_sales', ['client_id'], {
      name: 'idx_sale_client'
    });
    await queryInterface.addIndex('pos_sales', ['company_id']);
    await queryInterface.addIndex('pos_sales', ['terminal_id']);
    await queryInterface.addIndex('pos_sales', ['cashier_id']);
    await queryInterface.addIndex('pos_sales', ['payment_method_id']);
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('pos_sales').catch(() => null);
    if (!tableExists) {
      console.log('POS sales table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('pos_sales');
  }
};

