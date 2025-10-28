const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sponsorship = sequelize.define('Sponsorship', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => require('crypto').randomUUID()
  },
  donorId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'donors',
      key: 'id'
    }
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
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  paymentFrequency: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
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
  tableName: 'sponsorships',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Sponsorship;