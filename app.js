const express = require('express');
const { config } = require('dotenv');
config();
const app = express();

const dbConnection = require('./src/config/db.config');
dbConnection()

app.use(express.json({ extended: true }));


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", 'x-access-token, Content-Type, Access-Control-Allow-Headers');
  res.header("Access-Control-Allow-Methods", 'GET, POST, DELETE, PUT');
  next();
});

// const apiRoute = require('./routes/apiRoute');
// app.use('/api', apiRoute);

app.get('/*', (req, res) => {
  return res.send('Ensure Learning API')
});

module.exports = app;