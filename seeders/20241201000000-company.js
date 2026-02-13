'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if company already exists by unique name or email
    const existingCompany = await queryInterface.rawSelect('companies', {
      where: { name: 'Default Company' }
    }, ['company_id']).catch(() => null);

    if (existingCompany) {
      console.log('Company already exists, skipping seeder');
      return;
    }

    await queryInterface.bulkInsert('companies', [{
      name: 'Default Company',
      email: 'info@defaultco.example',
      phone: '000-000-0000',
      address: 'N/A',
      logo_url: null,
      currency: 'USD',
      date_format: 'YYYY-MM-DD',
      timezone: 'UTC',
      created_at: new Date(),
      updated_at: new Date(),
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('companies', { name: 'Default Company' }, {});
  }
};


