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

    // Add 'PENDING' to the status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE pos_sales 
      MODIFY COLUMN status ENUM('COMPLETED', 'CANCELLED', 'PENDING') NOT NULL DEFAULT 'COMPLETED';
    `);

    console.log('Added PENDING to pos_sales status ENUM successfully');
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.describeTable('pos_sales').catch(() => null);
    if (!tableExists) {
      console.log('POS sales table does not exist, skipping rollback');
      return;
    }

    // Note: We cannot safely remove an ENUM value if there are rows using it
    // So we'll convert any PENDING records to COMPLETED first, then remove PENDING
    await queryInterface.sequelize.query(`
      UPDATE pos_sales 
      SET status = 'COMPLETED' 
      WHERE status = 'PENDING';
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE pos_sales 
      MODIFY COLUMN status ENUM('COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED';
    `);

    console.log('Removed PENDING from pos_sales status ENUM successfully');
  }
};

