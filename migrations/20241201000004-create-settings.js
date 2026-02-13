'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('settings').catch(() => null);
    if (tableExists) {
      console.log('Settings table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('settings', {
      setting_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // Note: Foreign key constraint will be added after companies table is created
        // For now, we'll create the column without the foreign key constraint
      },
      setting_key: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      setting_value: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Add unique constraint for company_id and setting_key combination
    await queryInterface.addIndex('settings', ['company_id', 'setting_key'], {
      unique: true,
      name: 'unique_company_setting'
    });

    // Add index for better performance on company_id
    await queryInterface.addIndex('settings', ['company_id']);
    
    // Add index for setting_key for faster lookups
    await queryInterface.addIndex('settings', ['setting_key']);

    // Note: Foreign key constraint to companies table will be added when companies table is created
    // For now, we'll add a comment to indicate this needs to be done later
    console.log('⚠️  Note: Foreign key constraint to companies table needs to be added when companies table is created');
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('settings').catch(() => null);
    if (!tableExists) {
      console.log('Settings table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('settings');
  }
};
