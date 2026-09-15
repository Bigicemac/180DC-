const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
      }
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'finly_super_secure_jwt_secret_key_2026');
      } catch (e) {
        decoded = jwt.verify(token, 'finly_secret_key');
      }

      if (req.app.locals.dbConnected) {
        // MongoDB path
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'User not found' });
        }
      } else {
        // In-memory fallback: search through the in-memory store
        const memStore = req.app.locals.inMemoryUsers;
        let foundUser = null;
        if (memStore) {
          for (const [email, user] of memStore.entries()) {
            if (user._id === decoded.id || user.id === decoded.id) {
              foundUser = { ...user };
              delete foundUser.password;
              break;
            }
          }
        }
        
        // If server restarted and in-memory store was reset, recreate session for valid token
        if (!foundUser) {
          foundUser = { _id: decoded.id, id: decoded.id, name: 'Active User', email: 'user@finly.com' };
          if (memStore) {
            memStore.set('user@finly.com', foundUser);
          }
        }
        req.user = foundUser;
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = protect;
module.exports.protect = protect;
