const express = require('express');
const router = express.Router();

/*** Forward all requests to /api here */
const AuthRoutes = require('./AuthRoutes');
const ProjectRoutes = require('./ProjectRoutes');

router.use('/auth', AuthRoutes);
router.use('/projects', ProjectRoutes);


module.exports = router;