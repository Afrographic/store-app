'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const desiredRoles = [
      { name: 'admin', description: 'Administrator role with full system access' },
      { name: 'manager', description: 'Manager role with management permissions' },
      { name: 'user', description: 'Standard user role with basic permissions' },
    ];

    const rolesToInsert = [];
    for (const role of desiredRoles) {
      const exists = await queryInterface
        .rawSelect('roles', { where: { name: role.name } }, ['role_id'])
        .catch(() => null);
      if (!exists) {
        rolesToInsert.push({
          name: role.name,
          description: role.description,
          created_at: now,
          updated_at: now,
        });
      }
    }

    if (rolesToInsert.length > 0) {
      await queryInterface.bulkInsert('roles', rolesToInsert, {});
    } else {
      console.log('Roles already exist, skipping seeder');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: {
        [Sequelize.Op.in]: ['admin', 'manager', 'user']
      }
    }, {});
  }
};
