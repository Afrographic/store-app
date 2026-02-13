'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('clients');
    
    // Add client_code column if it doesn't exist
    if (!tableDescription.client_code) {
      console.log('Adding client_code column to clients table...');
      await queryInterface.addColumn('clients', 'client_code', {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
        after: 'client_id'
      });
      
      // Add index for client_code
      await queryInterface.addIndex('clients', ['client_code'], {
        name: 'idx_client_code'
      });
      console.log('Client code column added successfully');
    } else {
      console.log('Client code column already exists, skipping');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('clients');
    
    // Remove client_code column if it exists
    if (tableDescription.client_code) {
      console.log('Removing client_code column from clients table...');
      await queryInterface.removeIndex('clients', 'idx_client_code');
      await queryInterface.removeColumn('clients', 'client_code');
      console.log('Client code column removed successfully');
    }
  }
};

