'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists to prevent duplication
    const tableExists = await queryInterface.describeTable('files').catch(() => null);
    if (tableExists) {
      console.log('Files table already exists, skipping migration');
      return;
    }

    await queryInterface.createTable('files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      alt_text: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('files', ['uploaded_by']);
    await queryInterface.addIndex('files', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    // Check if table exists before dropping
    const tableExists = await queryInterface.describeTable('files').catch(() => null);
    if (!tableExists) {
      console.log('Files table does not exist, skipping rollback');
      return;
    }
    
    await queryInterface.dropTable('files');
  }
};

