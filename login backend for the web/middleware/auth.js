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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finly_secret_key');

      if (req.app.locals.dbConnected) {
        // MongoDB path
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
          return res.status(401).json({ success: false, message: 'User not found' });
        }
      } else {
        // In-memory fallback: search through the in-memory store
        // We store a reference on app.locals so middleware can access it
        const memStore = req.app.locals.inMemoryUsers;
        if (memStore) {
          let foundUser = null;
          for (const [email, user] of memStore.entries()) {
            if (user._id === decoded.id) {
              foundUser = { ...user };
              delete foundUser.password;
              break;
            }
          }
          if (!foundUser) {
            return res.status(401).json({ success: false, message: 'User not found' });
          }
          req.user = foundUser;
        } else {
          return res.status(401).json({ success: false, message: 'User store unavailable' });
        }
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
