const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('UNIVER', 'sttudent', 'xfitfit', {
  host: 'localhost',
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  },
  pool: {
    max: 10,
    min: 0,
    idle: 30000
  },
  logging: false
});

module.exports = sequelize;
