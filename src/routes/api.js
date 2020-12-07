const express = require('express');
const router = express.Router();

/*** Forward all requests to /api here */
const AuthRoutes = require('./AuthRoutes');

router.use('/auth', AuthRoutes);


module.exports = router;