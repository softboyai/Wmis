import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createError } from '../utils/errors.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(createError(401, 'Not authenticated. Please log in.'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+isActive');
    if (!user) {
      return next(createError(401, 'User no longer exists.'));
    }
    if (!user.isActive) {
      return next(createError(401, 'Your account has been deactivated. Contact the administrator.'));
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token. Please log in again.'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired. Please log in again.'));
    }
    next(err);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
};
