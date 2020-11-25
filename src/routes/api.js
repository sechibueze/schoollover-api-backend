const express = require('express');
const router = express.Router();

/*** Forward all requests to /api here */
const AuthRoutes = require('./AuthRoutes');

router.use('/auth', AuthRoutes);
router.use('/', (req, res) => {
  return res.json({
    message: 'Calling api'
  })
});

module.exports = router;