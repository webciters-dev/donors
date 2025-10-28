const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => require('crypto').randomUUID()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('STUDENT', 'DONOR', 'ADMIN', 'SUB_ADMIN', 'FIELD_OFFICER'),
    allowNull: false
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  donorId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = User;