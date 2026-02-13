'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Alter the ENUM type to include GPAY
    // Note: MySQL doesn't support direct ALTER ENUM, so we need to modify the column
    await queryInterface.sequelize.query(`
      ALTER TABLE payment_methods 
      MODIFY COLUMN type ENUM('CASH', 'CARD', 'UPI', 'GPAY', 'OTHER') NOT NULL
    `);
    
    console.log('Added GPAY to payment_methods type enum');
  },

  async down(queryInterface, Sequelize) {
    // Remove GPAY from the ENUM (only if no records use it)
    // Note: This will fail if there are records with GPAY type
    await queryInterface.sequelize.query(`
      ALTER TABLE payment_methods 
      MODIFY COLUMN type ENUM('CASH', 'CARD', 'UPI', 'OTHER') NOT NULL
    `);
    
    console.log('Removed GPAY from payment_methods type enum');
  }
};

