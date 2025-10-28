const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => require('crypto').randomUUID()
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fromRole: {
    type: DataTypes.STRING,
    allowNull: false
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'applications',
      key: 'id'
    }
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Message;