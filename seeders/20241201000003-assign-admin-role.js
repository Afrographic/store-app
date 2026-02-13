'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get admin user ID
    const adminUser = await queryInterface.rawSelect('users', {
      where: { username: 'admin' }
    }, ['user_id']).catch(() => null);
    
    if (!adminUser) {
      console.log('Admin user not found, skipping role assignment');
      return;
    }

    // Get admin role ID
    const adminRole = await queryInterface.rawSelect('roles', {
      where: { name: 'admin' }
    }, ['role_id']).catch(() => null);
    
    if (!adminRole) {
      console.log('Admin role not found, skipping role assignment');
      return;
    }

    // Check if role assignment already exists
    const existingAssignment = await queryInterface.rawSelect('user_roles', {
      where: { 
        user_id: adminUser,
        role_id: adminRole
      }
    }, ['user_role_id']).catch(() => null);
    
    if (existingAssignment) {
      console.log('Admin role already assigned, skipping');
      return;
    }

    // Assign admin role to admin user
    await queryInterface.bulkInsert('user_roles', [
      {
        user_id: adminUser,
        role_id: adminRole,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
    
    console.log('Admin role assigned to admin user');
  },

  async down(queryInterface, Sequelize) {
    // Get admin user ID
    const adminUser = await queryInterface.rawSelect('users', {
      where: { username: 'admin' }
    }, ['user_id']).catch(() => null);
    
    if (!adminUser) {
      console.log('Admin user not found, skipping role removal');
      return;
    }

    // Get admin role ID
    const adminRole = await queryInterface.rawSelect('roles', {
      where: { name: 'admin' }
    }, ['role_id']).catch(() => null);
    
    if (!adminRole) {
      console.log('Admin role not found, skipping role removal');
      return;
    }

    // Remove admin role assignment
    await queryInterface.bulkDelete('user_roles', {
      user_id: adminUser,
      role_id: adminRole
    }, {});
    
    console.log('Admin role removed from admin user');
  }
};
