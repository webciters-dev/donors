const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
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
  term: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  needUSD: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'DRAFT'),
    defaultValue: 'PENDING'
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fxRate: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  currency: {
    type: DataTypes.ENUM('USD', 'PKR', 'EUR', 'GBP', 'CAD', 'AUD'),
    allowNull: true
  },
  needPKR: {
    type: DataTypes.INTEGER,
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
  },
  tuitionFee: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  hostelFee: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  otherExpenses: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  familyIncome: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  familyContribution: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvalReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  livingExpenses: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  scholarshipAmount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  totalExpense: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  universityFee: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'applications',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Application;