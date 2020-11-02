const mongoose = require('mongoose');

const dbConnection = _ => {
  

  let uri = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGODBURI : 'mongodb://localhost:27017/schoollover-project';
  

  if (process.env.NODE_ENV === 'production') {
    uri = process.env.MONGODBURI;
  }

  const options = { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };

  mongoose.connect(uri, options,  err => {
    if (err) {
      return console.log('failed to connect to DB ', err);
    }
    return console.log('connect to DB ', uri);
  });
};

module.exports = dbConnection;