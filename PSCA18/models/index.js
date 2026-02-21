const sequelize = require('../dbconfig');
const Faculty = require('./Faculty');
const Pulpit = require('./Pulpit');
const Subject = require('./Subject');
const AuditoriumType = require('./AuditoriumType');
const Auditorium = require('./Auditorium');

Faculty.hasMany(Pulpit, { foreignKey: 'FACULTY', sourceKey: 'FACULTY', as: 'pulpits' });
Pulpit.belongsTo(Faculty, { foreignKey: 'FACULTY', targetKey: 'FACULTY', as: 'faculty' });

Pulpit.hasMany(Subject, { foreignKey: 'PULPIT', sourceKey: 'PULPIT', as: 'subjects' });
Subject.belongsTo(Pulpit, { foreignKey: 'PULPIT', targetKey: 'PULPIT', as: 'pulpit' });

AuditoriumType.hasMany(Auditorium, { foreignKey: 'AUDITORIUM_TYPE', sourceKey: 'AUDITORIUM_TYPE', as: 'auditoriums' });
Auditorium.belongsTo(AuditoriumType, { foreignKey: 'AUDITORIUM_TYPE', targetKey: 'AUDITORIUM_TYPE', as: 'auditoriumType' });

module.exports = {
  sequelize,
  Faculty,
  Pulpit,
  Subject,
  AuditoriumType,
  Auditorium
};
