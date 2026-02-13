'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.describeTable('pos_sales').catch(() => null);
    if (!tableExists) {
      console.log('POS sales table does not exist, skipping migration');
      return;
    }

    // Check current payment_status values
    const [results] = await queryInterface.sequelize.query(
      "SELECT payment_status FROM pos_sales WHERE payment_status = 'PARTIAL' LIMIT 1"
    );

    // If there are any PARTIAL records, update them to PENDING
    if (results && results.length > 0) {
      console.log('Found PARTIAL payment_status records, updating to PENDING...');
      await queryInterface.sequelize.query(
        "UPDATE pos_sales SET payment_status = 'PENDING' WHERE payment_status = 'PARTIAL'"
      );
    }

    // Remove PARTIAL from ENUM
    // Note: MySQL doesn't support removing values from ENUM directly, so we need to recreate it
    await queryInterface.sequelize.query(`
      ALTER TABLE pos_sales 
      MODIFY COLUMN payment_status ENUM('PAID', 'PENDING') NOT NULL DEFAULT 'PAID'
    `);

    console.log('Successfully removed PARTIAL from payment_status ENUM');
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.describeTable('pos_sales').catch(() => null);
    if (!tableExists) {
      console.log('POS sales table does not exist, skipping rollback');
      return;
    }

    // Add PARTIAL back to ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE pos_sales 
      MODIFY COLUMN payment_status ENUM('PAID', 'PENDING', 'PARTIAL') NOT NULL DEFAULT 'PAID'
    `);

    console.log('Successfully added PARTIAL back to payment_status ENUM');
  }
};

