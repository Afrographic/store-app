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

    // Add 'POS_SALE' to the reference_type ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE stock_movements 
      MODIFY COLUMN reference_type ENUM('ORDER_PURCHASE', 'ORDER_SELL', 'ADJUSTMENT', 'TRANSFER', 'OPENING_STOCK', 'POS_SALE') NULL;
    `);

    console.log('Added POS_SALE to reference_type ENUM successfully');
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.describeTable('stock_movements').catch(() => null);
    if (!tableExists) {
      console.log('Stock movements table does not exist, skipping rollback');
      return;
    }

    // Note: We cannot safely remove an ENUM value if there are rows using it
    // So we'll just log a warning
    console.log('Warning: Cannot remove POS_SALE from reference_type ENUM if there are existing records using it');
    
    // If you want to force remove it (not recommended), uncomment below:
    // await queryInterface.sequelize.query(`
    //   ALTER TABLE stock_movements 
    //   MODIFY COLUMN reference_type ENUM('ORDER_PURCHASE', 'ORDER_SELL', 'ADJUSTMENT', 'TRANSFER', 'OPENING_STOCK') NULL;
    // `);
  }
};

