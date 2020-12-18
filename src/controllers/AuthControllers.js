const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const { validationResult } = require('express-validator');
const EmailService = require('../_helpers/EmailService');
const User = require('../models/User');

/*** Handle User sign up request ***/
const signup = (req, res) => {
  
  /*** Check for validation errors ***/
  const errorsContainer = validationResult(req);
  if (!errorsContainer.isEmpty()) {
    return res.status(422).json({
      status: false,
      errors: errorsContainer.errors.map(err => err.msg)
    });
  }

  /**** Request has passed all validations ****/
  const { firstname, lastname, email, password } = req.body;
  User.findOne({ email }, (err , user) => {

    if ( err ) return res.status(500).json({ status: false, error: 'Internal Server error:: Could not retrieve record'});
    
    if ( user ) return res.status(400).json({ status: false, error: 'Record exist, please login'});

    /*** Package new user data */
    const defaultProfileImageUrl = gravatar.url(email, {s: '150', d: 'mm', r: 'pg'}, true);
    const newUser = new User({firstname, lastname, email, password, profileImage: defaultProfileImageUrl});
    /*** Hash password */
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to generate salt' });

      bcrypt.hash(password, salt, (err, hash) => {
        if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to hash password' });

        newUser.password = hash;
        newUser.save(err => {
          if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to save user' });

          const link = `${process.env.CLIENT}/auth/${ newUser._id}/account-confirmation`
          const msg = {
              to: email,
              from: process.env.SENDER_MAIL,
              subject: 'Account Confirmation',
              text: 'Confirm your account',
              html: `
                Dear ${ firstname },
                <br />
                <br />
                Thank you for joining our programme. Just one more step.
                Please, click on the link below to reset your password or copy the link and paste in your browser,
                <br />
                <br />

                <a href="${link}" 
                  style="text-decoration: none;padding: 1rem 2.25rem; font-size: 1.2rem; font-weight: 900; background-color: #00602d; color: white; margin: auto; text-align: center; display: block; width: 80%;"
                > Confirm Account </a>
                <br />
                <br />

                ${ link }

                <br />
                <br />

              Best Wishes, <br />
              ELF Team
              `,
            };

          const payload = { id : newUser._id, auth: newUser.roles };
          jwt.sign(
            payload ,
            process.env.JWT_SECRET_KEY,
            { expiresIn: 60*60*3 },
            (err, token) => {
              if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to generate token' });
              let emailSent = false;
              EmailService.send(msg)
                .then(response => {
                  emailSent = true;
                })
                // .catch(err => {
                //   return res.status(500).json({
                //     status: false,
                //     errors: 'Failed to send confirmation email'
                //   });
                // })
                .finally(val => {
                  
                  return res.status(201).json({
                    status: true,
                    message: `User signup successful ${ emailSent ? 'Check your mail' : ''}`,
                    token
                  });
                })
          })
        })

      })
    })
  });
};

/***Login existing users */
const login = (req, res) => {
  const errorsContainer = validationResult(req);
  if (!errorsContainer.isEmpty()) {
    return res.status(422).json({
      status: false,
      errors: errorsContainer.errors.map(err => err.msg)
    });
  }

  /***Submitted data have passed all validations */
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err) return res.status(500).json({ status: false, error: 'Server error:: Could not retrieve record' });

    if (!user) return res.status(403).json({ status: false, error: 'Account does not exist' });

    /** User has account **/
      bcrypt.compare( password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to compare password' });

        if (!isMatch) return res.status(401).json({ status: false, error: 'Account does not exist' });

        const payload = { id: user._id, auth: user.roles };
          jwt.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: 60 * 60 * 60 },
            (err, token) => {
              if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to generate token' });

              return res.status(200).json({
                status: true,
                message: 'User login successful',
                token
              });
            })
      })
  });
}

// Verify user with token
const getAuthenticatedUserData = (req, res) => {
  const currentUserId = req.authUser.id;

  User.findOne({_id: currentUserId})
    .select('-password')
    .then(user => {
      let data = {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        profileImage: user.profileImage,
        active: user.active,
        auth: user.auth,
        accountConfirmation: user.confirmation
      };
      return res.status(200).json({
        status: true,
        message: 'Authorized User data',
        data
      })

    })
    .catch(err => {
      return res.status(500).json({
        status: false,
        error: 'Failed to authenticate user'
      })
    })
};

/**** Allow Users to confirm account */
const confirmUserAccount = (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      status: false,
      error: 'Inavlid request'
    });
  }

  User.findOneAndUpdate({ _id: id}, { confirmation: true })
    .then(confirmedUser => {
      return res.status(200).json({
        status: false,
        message: 'User account confirmed',
        data: confirmUserAccount
      });
    }).catch(err => {
      return res.status(500).json({
        status: false,
        error: 'Failed to confirm accoount'
      });
    })
}

/*** Send an email so user can follow link to reset passord */
const requestPasswordResetToken = (req, res) => {
  const errorsContainer = validationResult(req);
  if (!errorsContainer.isEmpty()) {
    return res.status(422).json({
      status: false,
      errors: errorsContainer.errors.map(err => err.msg)
    });
  }

  /*** User data passed validations */

  const { email } = req.body;
  User.findOne({ email})
    .then(async user => {
      if ( !user ) return res.status(401).json({ status: false, error: 'Thank you! If we find a matching data, we will sent password reset instructions to it'});

      /** User account does exists */
      await user.generatePasswordResetToken();

      user.save(err => {
        if (err) {
          return res.status(500).json({
            status: false,
            error: 'Failed to update password reset token'
          });
        }

        const link = `${process.env.CLIENT}/auth/reset-password/${ user.passwordResetToken }`
        const msg = {
            to: email,
            from: process.env.SENDER_MAIL,
            subject: 'Password Reset',
            // text: 'Confirm your account',
            html: `
              Dear ${ user.firstname },
              <br />
              <br />
              You have requested to reset your password.
              Please, click on the link below to reset your password or copy the link and paste in your browser,
              <br />
              <br />

              <a href="${link}" 
                style="text-decoration: none;padding: 1rem 2.25rem; font-size: 1.2rem; font-weight: 900; background-color: #00602d; color: white; margin: auto; text-align: center; display: block; width: 80%;"
              > Reset your password </a>
              <br />
              <br />

              ${ link }

              <br />
              <br />

            Best Wishes, <br />
            ELF Team
            `,
          };

        EmailService.send(msg)
          .then(response => {
            return res.status(201).json({
              status: true,
              message: `Thank you! If we find a matching data, we will sent password reset instructions to it`,
              data: link
            });
          })
          .catch(err => {
            return res.status(500).json({
              status: false,
              errors: 'Failed to send password reset email'
            });
          })
          
      })
      

    })
    .catch(err => {
      return res.status(422).json({
        status: false,
        error: 'No such user exists' // change this later => security
      });
    })
}

/**** Allow users to reset auth data => Password */
const resetAuthPassword = (req, res) => {
    const errorsContainer = validationResult(req);
    if (!errorsContainer.isEmpty()) {
      return res.status(422).json({
        status: false,
        errors: errorsContainer.errors.map(err => err.msg)
      });
    }

    /*** User data passed validations */
    const { passwordResetToken, newPassword } = req.body;

    User.findOne({ passwordResetToken })
      .then(authUser => {

        if ( !authUser ) return res.status(401).json({ status: false, error: 'Request invalid. Unauthorized to reset password'});
        
        if ( Date.now() > authUser.resetPasswordValidity ) return res.status(400).json({ status: false, error: 'Request invalid. You are using expired link'});

        bcrypt.genSalt(10, (err, salt) => {
        if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to generate salt' });

          bcrypt.hash(newPassword, salt, (err, hash) => {
            if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to hash password' });
            /**** Update User record */
            authUser.password = hash;
            authUser.save(err => {
              if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to save user' });

              const link = `${process.env.CLIENT}/login`
              const msg = {
                  to: authUser.email,
                from: process.env.SENDER_MAIL,
                subject: 'Password Reset Successfully',
                html: `
                  Dear ${ authUser.firstname },
                  <br />
                  <br />
                  Your password has benn successfully updated.
                  Please, click on the link below to reset your password or copy the link and paste in your browser,
                  <br />
                  <br />

                  <a href="${link}" 
                    style="text-decoration: none;padding: 1rem 2.25rem; font-size: 1.2rem; font-weight: 900; background-color: #00602d; color: white; margin: auto; text-align: center; display: block; width: 80%;"
                  > Login </a>
                  <br />
                  <br />

                  ${ link }

                  <br />
                  <br />

                Best Wishes, <br />
                ELF Team
                `,
              };
                EmailService.send(msg)
                  
                  .finally(val => {
                    
                    return res.status(201).json({
                      status: true,
                      message: 'Password updated succeessfully',
                      data: authUser._id
                    });
                  })
            })
          })

        })

      })
      .catch(err => {
        return res.status(500).json({
          status: false,
          error: 'Internal Server Error'
        });
      })

}

/**** Toggle Admin Auth */
const toggleAdminAuth = (req, res) => {
    const errorsContainer = validationResult(req);
    if (!errorsContainer.isEmpty()) {
      return res.status(422).json({
        status: false,
        errors: errorsContainer.errors.map(err => err.msg)
      });
    }

    /*** User data passed validations */
    const { email } = req.body;

    User.findOne({ email })
      .then(authUser => {

        if ( !authUser ) return res.status(401).json({ status: false, error: 'Request invalid. Unauthorized to reset password'});

        if(authUser.auth.includes('admin')){
          authUser.auth = authUser.auth.filter(mono => mono !== 'admin');
        } else{
          authUser.auth = [...authUser.auth, 'admin'];
        }
            authUser.save(err => {
              if (err) return res.status(500).json({ status: false, error: 'Server error:: Failed to save user' });

                return res.status(201).json({
                  status: true,
                  message: 'User Auth has been updated',
                  data: authUser.auth
                });
                
            })

      })
      .catch(err => {
        return res.status(500).json({
          status: false,
          error: 'Internal Server Error'
        });
      })

}

/****Allow authenticated Mmeber to see  project */
const getUsers = (req, res) => {
  let filter = {};
  const { id } = req.query;
  if(id) filter._id = id;

  // const currentUserId = req.authUser.id;
  User
      .find(filter)
      .then(users => {
         
          return res.status(200).json({
              status: true,
              message: 'project deleted',
              data: users
          })

      }).catch(err => {
          if (err) {
              return res.status(500).json({
                  status: false,
                  error: 'Internal Server error'
              })
          }
      })
};
/****Allow authenticated ADMIN to delete  project */
const deleteUsers = (req, res) => {
  let filter = {};
  const { id } = req.query;
  if(id) filter._id = id;

  // const currentUserId = req.authUser.id;
  User
      .find(filter)
      .then( users => {
          console.log('users to delete', users)

          const result = users.map(async user => {
             await user.remove();
           })
          // User.deleteMany(filter, (err, prevUser) => {
          //     if (err) {
          //         return res.status(500).json({
          //             status: false,
          //             error: 'Internal Server error'
          //         })
          //     }

              return res.status(200).json({
                  status: true,
                  message: 'Users deleted',
                  data: result
              })
          // })


      })
};


module.exports = {
  signup,
  login, 
  getAuthenticatedUserData,
  confirmUserAccount,
  requestPasswordResetToken,
  resetAuthPassword,
  toggleAdminAuth,

  getUsers,
  deleteUsers,
};