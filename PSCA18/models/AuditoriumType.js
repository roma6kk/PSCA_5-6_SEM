const { DataTypes } = require('sequelize');
const sequelize = require('../dbconfig');

const AuditoriumType = sequelize.define('AUDITORIUM_TYPE', {
  AUDITORIUM_TYPE: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'AUDITORIUM_TYPE'
  },
  AUDITORIUM_TYPENAME: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'AUDITORIUM_TYPENAME'
  }
}, {
  tableName: 'AUDITORIUM_TYPE',
  timestamps: false
});

module.exports = AuditoriumType;
