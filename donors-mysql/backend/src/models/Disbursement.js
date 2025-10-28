const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Disbursement = sequelize.define('Disbursement', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => require('crypto').randomUUID()
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('INITIATED', 'COMPLETED', 'FAILED'),
    defaultValue: 'INITIATED'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amountOriginal: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currencyOriginal: {
    type: DataTypes.ENUM('USD', 'PKR', 'EUR', 'GBP', 'CAD', 'AUD'),
    allowNull: true
  },
  amountBaseUSD: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  baseCurrency: {
    type: DataTypes.ENUM('USD', 'PKR', 'EUR', 'GBP', 'CAD', 'AUD'),
    defaultValue: 'USD'
  },
  fxRateToUSD: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  fxAsOf: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'disbursements',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Disbursement;