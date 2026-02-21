const { DataTypes } = require('sequelize');
const sequelize = require('../dbconfig');

const Pulpit = sequelize.define('PULPIT', {
  PULPIT: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'PULPIT'
  },
  PULPIT_NAME: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'PULPIT_NAME'
  },
  FACULTY: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'FACULTY',
    references: {
      model: 'FACULTY',
      key: 'FACULTY'
    }
  }
}, {
  tableName: 'PULPIT',
  timestamps: false
});

module.exports = Pulpit;
