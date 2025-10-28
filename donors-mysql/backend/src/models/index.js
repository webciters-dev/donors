const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Student = require('./Student');
const Donor = require('./Donor');
const Application = require('./Application');
const Sponsorship = require('./Sponsorship');
const Document = require('./Document');
const Message = require('./Message');
const Disbursement = require('./Disbursement');

// Define associations
User.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
User.belongsTo(Donor, { foreignKey: 'donorId', as: 'donor' });
Student.hasOne(User, { foreignKey: 'studentId', as: 'user' });
Donor.hasOne(User, { foreignKey: 'donorId', as: 'user' });

Student.hasMany(Application, { foreignKey: 'studentId', as: 'applications' });
Application.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Document, { foreignKey: 'studentId', as: 'documents' });
Document.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Application.hasMany(Document, { foreignKey: 'applicationId', as: 'documents' });
Document.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Donor.hasMany(Sponsorship, { foreignKey: 'donorId', as: 'sponsorships' });
Sponsorship.belongsTo(Donor, { foreignKey: 'donorId', as: 'donor' });

Student.hasMany(Sponsorship, { foreignKey: 'studentId', as: 'sponsorships' });
Sponsorship.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Message, { foreignKey: 'studentId', as: 'messages' });
Message.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Application.hasMany(Message, { foreignKey: 'applicationId', as: 'messages' });
Message.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Student.hasMany(Disbursement, { foreignKey: 'studentId', as: 'disbursements' });
Disbursement.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

module.exports = {
  sequelize,
  User,
  Student,
  Donor,
  Application,
  Sponsorship,
  Document,
  Message,
  Disbursement
};