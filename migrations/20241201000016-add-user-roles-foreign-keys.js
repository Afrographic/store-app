'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration adds the foreign key constraint to locations table for user_roles
    // It should be run after the locations table is created
    
    // Check if locations table exists
    const locationsTableExists = await queryInterface.describeTable('locations').catch(() => null);
    if (!locationsTableExists) {
      console.log('⚠️  Locations table does not exist. Skipping foreign key constraint addition.');
      console.log('   Run this migration again after creating the locations table.');
      return;
    }

    // Check if user_roles table exists
    const userRolesTableExists = await queryInterface.describeTable('user_roles').catch(() => null);
    if (!userRolesTableExists) {
      console.log('User roles table does not exist. Skipping foreign key constraint addition.');
      return;
    }

    // Add foreign key constraint for location_id
    await queryInterface.addConstraint('user_roles', {
      fields: ['location_id'],
      type: 'foreign key',
      name: 'fk_user_roles_location_id',
      references: {
        table: 'locations',
        field: 'location_id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    console.log('✅ Foreign key constraint added to user_roles table');
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('user_roles', 'fk_user_roles_location_id');
    console.log('Foreign key constraint removed from user_roles table');
  }
};
