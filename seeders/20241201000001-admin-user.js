'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if admin user already exists to prevent duplication
    const existingAdmin = await queryInterface.rawSelect('users', {
      where: { username: 'admin' }
    }, ['user_id']).catch(() => null);
    
    if (existingAdmin) {
      console.log('Admin user already exists, skipping seeder');
      return;
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password_hash: hashedPassword,
        email: 'admin@example.com',
        full_name: 'System Administrator',
        company_id: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Check if admin user exists before removing
    const existingAdmin = await queryInterface.rawSelect('users', {
      where: { username: 'admin' }
    }, ['user_id']).catch(() => null);
    
    if (!existingAdmin) {
      console.log('Admin user does not exist, skipping rollback');
      return;
    }

    // Remove admin user
    await queryInterface.bulkDelete('users', {
      username: 'admin'
    }, {});
  }
};
