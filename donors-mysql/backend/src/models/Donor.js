const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Donor = sequelize.define('Donor', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => require('crypto').randomUUID()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalFunded: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currencyPreference: {
    type: DataTypes.ENUM('USD', 'PKR', 'EUR', 'GBP', 'CAD', 'AUD'),
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'donors',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Donor;