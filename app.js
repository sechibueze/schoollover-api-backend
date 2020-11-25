const express = require('express');
const { config } = require('dotenv');
config(); /*** Load environment variable(s) into process.env ***/
const app = express();

/*** Run connection to Database */
const dbConnection = require('./src/config/db.config');
dbConnection();

/*** Allow express to parse request body */
app.use(express.json({ extended: true }));

/*** set Request Header configuration/CORS */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", 'x-access-token, Content-Type, Access-Control-Allow-Headers');
  res.header("Access-Control-Allow-Methods", 'GET, POST, DELETE, PUT');
  next();
});

const api = require('./src/routes/api');
app.use('/api', api);

app.get('/*', (req, res) => {
  return res.send('Ensure Learning API')
});

module.exports = app;