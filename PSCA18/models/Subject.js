const { DataTypes } = require('sequelize');
const sequelize = require('../dbconfig');

const Subject = sequelize.define('SUBJECT', {
  SUBJECT: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'SUBJECT'
  },
  SUBJECT_NAME: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'SUBJECT_NAME'
  },
  PULPIT: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'PULPIT',
    references: {
      model: 'PULPIT',
      key: 'PULPIT'
    }
  }
}, {
  tableName: 'SUBJECT',
  timestamps: false
});

module.exports = Subject;
