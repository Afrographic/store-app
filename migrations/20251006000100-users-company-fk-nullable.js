'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop existing FK to allow altering nullability
    try {
      await queryInterface.removeConstraint('users', 'fk_users_company_id');
    } catch (e) {
      // ignore if not exists
    }

    // Make column nullable
    await queryInterface.changeColumn('users', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Recreate FK with SET NULL on delete
    await queryInterface.addConstraint('users', {
      fields: ['company_id'],
      type: 'foreign key',
      name: 'fk_users_company_id',
      references: {
        table: 'companies',
        field: 'company_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop FK
    try {
      await queryInterface.removeConstraint('users', 'fk_users_company_id');
    } catch (e) {}

    // Make column NOT NULL again
    await queryInterface.changeColumn('users', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Recreate original FK with CASCADE
    await queryInterface.addConstraint('users', {
      fields: ['company_id'],
      type: 'foreign key',
      name: 'fk_users_company_id',
      references: {
        table: 'companies',
        field: 'company_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  }
};


