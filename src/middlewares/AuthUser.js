const jwt = require('jsonwebtoken');

 
function AuthUser(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ status: false, error: 'Invalid::No token in header' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
     if (err) return res.status(500).json({ status: false, error: 'Server error:: Could not decode token' });
    
     const authUser = { 
       id: decoded.id,
       auth: decoded.auth
      }
      req.authUser = authUser;
      next();
  });
}


module.exports = AuthUser;