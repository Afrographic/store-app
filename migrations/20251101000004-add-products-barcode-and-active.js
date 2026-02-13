'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('products');
    
    // Add barcode column if it doesn't exist
    if (!tableDescription.barcode) {
      console.log('Adding barcode column to products table...');
      await queryInterface.addColumn('products', 'barcode', {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        after: 'sku'
      });
      
      // Add index for barcode
      await queryInterface.addIndex('products', ['barcode'], {
        name: 'idx_product_barcode'
      });
      console.log('Barcode column added successfully');
    } else {
      console.log('Barcode column already exists, skipping');
    }
    
    // Add is_active column if it doesn't exist
    if (!tableDescription.is_active) {
      console.log('Adding is_active column to products table...');
      await queryInterface.addColumn('products', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
      
      // Add index for is_active
      await queryInterface.addIndex('products', ['is_active'], {
        name: 'idx_product_active'
      });
      console.log('is_active column added successfully');
    } else {
      console.log('is_active column already exists, skipping');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('products');
    
    // Remove barcode column if it exists
    if (tableDescription.barcode) {
      console.log('Removing barcode column from products table...');
      await queryInterface.removeIndex('products', 'idx_product_barcode');
      await queryInterface.removeColumn('products', 'barcode');
      console.log('Barcode column removed successfully');
    }
    
    // Remove is_active column if it exists
    if (tableDescription.is_active) {
      console.log('Removing is_active column from products table...');
      await queryInterface.removeIndex('products', 'idx_product_active');
      await queryInterface.removeColumn('products', 'is_active');
      console.log('is_active column removed successfully');
    }
  }
};

