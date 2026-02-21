const { DataTypes } = require('sequelize');
const sequelize = require('../dbconfig');

const Auditorium = sequelize.define('AUDITORIUM', {
  AUDITORIUM: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'AUDITORIUM'
  },
  AUDITORIUM_NAME: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'AUDITORIUM_NAME'
  },
  AUDITORIUM_CAPACITY: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'AUDITORIUM_CAPACITY'
  },
  AUDITORIUM_TYPE: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'AUDITORIUM_TYPE',
    references: {
      model: 'AUDITORIUM_TYPE',
      key: 'AUDITORIUM_TYPE'
    }
  }
}, {
  tableName: 'AUDITORIUM',
  timestamps: false
});

module.exports = Auditorium;
