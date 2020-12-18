const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const AuthUser = require('../middlewares/AuthUser');
const { 
  signup,
  login,
  getAuthenticatedUserData,
  confirmUserAccount,
  requestPasswordResetToken,
  resetAuthPassword,
  toggleAdminAuth,
  getUsers,
  deleteUsers
} = require('../controllers/AuthControllers');

/*** Forward all requests to /api/auth here */

/***
 * @route POST /api/auth/signup
 * @desc Allow new users to signup
 * @access public
 */
router.post('/signup', [
  check('firstname', 'Firstname is required').notEmpty(),
  check('lastname', 'Lastname is required').notEmpty(),
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').notEmpty(),
],signup);


/***
 * @route POST /api/auth/login
 * @desc Allow existing users to login
 * @access public
 */
router.post('/login', [
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').notEmpty(),
], login);

/***
 * @route GET /api/auth/
 * @desc Get Authenticated User data
 * @access private
 */
router.get('/', AuthUser, getAuthenticatedUserData );

/***
 * @route GET /api/auth/:id/account_confirmation
 * @desc Allow User to confirm account
 * @access public
 */
router.get('/:id/account_confirmation', confirmUserAccount);

/***
 * @route PUT /api/auth/request-password-reset-token
 * @desc Allow User to request a token to change password
 * @access public
 */
router.put('/request-password-reset-token', [
  check('email', 'Email is required').isEmail(),
], requestPasswordResetToken);

/***
 * @route PUT /api/auth/reset-auth-password
 * @desc Allow User to reeset password
 * @access public
 */
router.put('/reset-auth-password', [
  check('passwordResetToken', 'Token is required').notEmpty(),
  check('newPassword', 'New passwod is required').notEmpty(),
], resetAuthPassword);

/***
 * @route PUT /api/auth/update-auth
 * @desc Allow Any valid user to update/toggle his Auth level
 * @access public/secret
 */
router.put('/update-auth', [
  check('email', 'Email is required').isEmail(),
], toggleAdminAuth);



/***
 * @route PUT /api/auth/update-auth
 * @desc Allow Any valid user to update/toggle his Auth level
 * @access public/secret
 */
router.get('/users', getUsers);
/***
 * @route PUT /api/auth/update-auth
 * @desc Allow Any valid user to update/toggle his Auth level
 * @access public/secret
 */
router.delete('/users', deleteUsers);

module.exports = router;