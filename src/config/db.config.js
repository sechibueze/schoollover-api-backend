const mongoose = require('mongoose');

const dbConnection = () => {
  
  let uri = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGODBURI : 'mongodb://localhost:27017/schoollover-project';
  
  /*** App runs in PRODUCTION */
  if (process.env.NODE_ENV === 'production') {
    uri = process.env.MONGODBURI;
  }

  /*** Mongoose configuration options */
  const configOptions = { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };

  mongoose.connect(uri, configOptions,  err => {
    if (err) {
      return console.log('failed to connect to DB ', err);
    }
    return console.log('successfully connected to DB ', uri);
  });
};

module.exports = dbConnection;