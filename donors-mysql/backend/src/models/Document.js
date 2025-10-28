const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
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
  applicationId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'applications',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'CNIC', 'GUARDIAN_CNIC', 'PHOTO', 'SSC_RESULT', 'HSSC_RESULT',
      'UNIVERSITY_CARD', 'FEE_INVOICE', 'INCOME_CERTIFICATE', 'UTILITY_BILL',
      'TRANSCRIPT', 'DEGREE_CERTIFICATE', 'ENROLLMENT_CERTIFICATE', 'OTHER'
    ),
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Document;