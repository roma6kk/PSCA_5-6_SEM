const { DataTypes } = require('sequelize');
const sequelize = require('../dbconfig');

const Faculty = sequelize.define('FACULTY', {
  FACULTY: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'FACULTY'
  },
  FACULTY_NAME: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'FACULTY_NAME'
  }
}, {
  tableName: 'FACULTY',
  timestamps: false
});

module.exports = Faculty;
