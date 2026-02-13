'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.describeTable('stock_movements').catch(() => null);
    if (!tableExists) {
      console.log('Stock movements table does not exist, skipping migration');
      return;
    }

    // For MySQL, we need to modify the ENUM columns
    // Step 1: Modify movement_type enum - Remove 'TRANSFER', keep only 'IN' and 'OUT'
    await queryInterface.sequelize.query(`
      ALTER TABLE stock_movements 
      MODIFY COLUMN movement_type ENUM('IN', 'OUT') NOT NULL;
    `);

    // Step 2: Modify reference_type enum - Update with new values
    await queryInterface.sequelize.query(`
      ALTER TABLE stock_movements 
      MODIFY COLUMN reference_type ENUM('ORDER_PURCHASE', 'ORDER_SELL', 'ADJUSTMENT', 'TRANSFER', 'OPENING_STOCK') NULL;
    `);

    console.log('Stock movement ENUM types updated successfully');
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.describeTable('stock_movements').catch(() => null);
    if (!tableExists) {
      console.log('Stock movements table does not exist, skipping rollback');
      return;
    }

    // Rollback to original ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE stock_movements 
      MODIFY COLUMN movement_type ENUM('IN', 'OUT', 'TRANSFER') NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE stock_movements 
      MODIFY COLUMN reference_type ENUM('ORDER', 'ADJUSTMENT', 'TRANSFER') NULL;
    `);

    console.log('Stock movement ENUM types rolled back to original values');
  }
};

