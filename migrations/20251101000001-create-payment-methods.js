'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('payment_methods').catch(() => null);
    if (tableExists) {
      console.log('Payment methods table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('payment_methods', {
      payment_method_id: {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('CASH', 'CARD', 'UPI', 'OTHER'),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('payment_methods', ['company_id']);
    await queryInterface.addIndex('payment_methods', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('payment_methods').catch(() => null);
    if (!tableExists) {
      console.log('Payment methods table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('payment_methods');
  }
};

