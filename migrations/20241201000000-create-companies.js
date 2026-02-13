'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('companies').catch(() => null);
    if (tableExists) {
      console.log('Companies table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('companies', {
      company_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      logo_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: 'USD'
      },
      date_format: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: 'YYYY-MM-DD'
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'UTC'
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

    // Add indexes for better performance
    await queryInterface.addIndex('companies', ['name']);
    await queryInterface.addIndex('companies', ['email']);
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('companies').catch(() => null);
    if (!tableExists) {
      console.log('Companies table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('companies');
  }
};
