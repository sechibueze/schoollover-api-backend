const DataURIParser = require('datauri/parser');
const path = require('path');
const dURI = new DataURIParser();

const getDataURI = file => {
  if (file) {
    const fileExtension = path.extname(file.originalname);
   return dURI.format(fileExtension, file.buffer).content;
  }else{
    return false;
  }
};

module.exports = { getDataURI };