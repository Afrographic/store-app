'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration adds the foreign key constraint to companies table
    // It should be run after the companies table is created
    
    // Check if companies table exists
    const companiesTableExists = await queryInterface.describeTable('companies').catch(() => null);
    if (!companiesTableExists) {
      console.log('⚠️  Companies table does not exist. Skipping foreign key constraint addition.');
      console.log('   Run this migration again after creating the companies table.');
      return;
    }

    // Check if settings table exists
    const settingsTableExists = await queryInterface.describeTable('settings').catch(() => null);
    if (!settingsTableExists) {
      console.log('Settings table does not exist. Skipping foreign key constraint addition.');
      return;
    }

    // Add foreign key constraint
    await queryInterface.addConstraint('settings', {
      fields: ['company_id'],
      type: 'foreign key',
      name: 'fk_settings_company_id',
      references: {
        table: 'companies',
        field: 'company_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    console.log('✅ Foreign key constraint added to settings table');
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('settings', 'fk_settings_company_id');
    console.log('Foreign key constraint removed from settings table');
  }
};
