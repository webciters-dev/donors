const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
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
  gender: {
    type: DataTypes.STRING,
    allowNull: false
  },
  university: {
    type: DataTypes.STRING,
    allowNull: false
  },
  field: {
    type: DataTypes.STRING,
    allowNull: false
  },
  program: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gpa: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  gradYear: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  province: {
    type: DataTypes.STRING,
    allowNull: true
  },
  needUSD: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sponsored: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  studentPhase: {
    type: DataTypes.ENUM('APPLICATION', 'ACTIVE', 'GRADUATED'),
    defaultValue: 'APPLICATION'
  },
  cnic: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  guardianName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guardianCnic: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentInstitution: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentCity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentCompletionYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  personalIntroduction: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  academicAchievements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  careerGoals: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  communityInvolvement: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentAcademicYear: {
    type: DataTypes.STRING,
    allowNull: true
  },
  familySize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  monthlyFamilyIncome: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parentsOccupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  specificField: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'students',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Student;