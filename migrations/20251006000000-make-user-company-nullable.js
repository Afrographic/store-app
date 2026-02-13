'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make users.company_id nullable to allow users without a company
    await queryInterface.changeColumn('users', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'company_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert to NOT NULL (requires existing rows to have a company)
    await queryInterface.changeColumn('users', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'company_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  }
};


