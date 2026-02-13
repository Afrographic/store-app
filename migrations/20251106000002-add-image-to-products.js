'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.describeTable('products').catch(() => null);
    if (!tableExists) {
      console.log('Products table does not exist, skipping migration');
      return;
    }

    // Check if image column already exists
    const tableDescription = await queryInterface.describeTable('products');
    if (tableDescription.image) {
      console.log('Image column already exists in products table, skipping');
      return;
    }

    // Add image column
    await queryInterface.addColumn('products', 'image', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'URL or path to product image'
    });

    console.log('Added image column to products table successfully');
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.describeTable('products').catch(() => null);
    if (!tableExists) {
      console.log('Products table does not exist, skipping rollback');
      return;
    }

    // Check if image column exists
    const tableDescription = await queryInterface.describeTable('products');
    if (tableDescription.image) {
      await queryInterface.removeColumn('products', 'image');
      console.log('Removed image column from products table successfully');
    } else {
      console.log('Image column does not exist, skipping rollback');
    }
  }
};

