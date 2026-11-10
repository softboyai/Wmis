import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { createError } from '../utils/errors.js';
import { logActivity } from '../utils/activityLogger.js';
import { registerUserSchema, changePasswordSchema, forgotPasswordSchema, loginSchema } from '../validators/schemas.js';
import validator from 'validator';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const setCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const login = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Incorrect email or password',
        errors: [],
      });
    }
    const { email, password } = result.data;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +isActive');
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password', errors: [] });
    }

    if (user.isLocked()) {
      await logActivity({
        user,
        action: 'account_locked',
        details: 'Login attempt on locked account',
        ipAddress: req.ip,
      });
      return res.status(401).json({
        message: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
        errors: [],
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Incorrect email or password', errors: [] });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      await logActivity({
        user,
        action: 'login_failed',
        details: 'Invalid password attempt',
        ipAddress: req.ip,
      });
      return res.status(401).json({ message: 'Incorrect email or password', errors: [] });
    }

    await user.resetLoginAttempts();
    const { accessToken, refreshToken } = generateTokens(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.cookie('refreshToken', refreshToken, setCookieOptions());

    await logActivity({
      user,
      action: 'login',
      details: 'User logged in successfully',
      ipAddress: req.ip,
    });

    res.json({
      accessToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refreshTokens = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return next(createError(401, 'No refresh token provided.'));

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken +isActive');

    if (!user || user.refreshToken !== token) {
      return next(createError(401, 'Invalid refresh token.'));
    }
    if (!user.isActive) return next(createError(401, 'Account deactivated.'));

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    res.cookie('refreshToken', newRefreshToken, setCookieOptions());
    res.json({ accessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(createError(401, 'Invalid refresh token.'));
    }
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
      await logActivity({ user: req.user, action: 'logout', ipAddress: req.ip });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const schema = changePasswordSchema(user.email, user.fullName);
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const { currentPassword, newPassword } = result.data;
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect.',
        errors: [{ field: 'currentPassword', message: 'Current password is incorrect.' }],
      });
    }
    user.password = newPassword;
    await user.save();
    await logActivity({ user, action: 'password_change', details: 'Password changed', ipAddress: req.ip });
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Please provide a valid email address.',
        errors: [{ field: 'email', message: 'Please provide a valid email address.' }],
      });
    }
    const { email } = result.data;
    // Always respond with success message to prevent email enumeration
    const user = await User.findOne({ email });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      await User.findByIdAndUpdate(user._id, {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      });
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
      // In development, log the reset link to the server console
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n=== PASSWORD RESET LINK (development only) ===');
        console.log(`User: ${user.email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('==============================================\n');
      }
      await logActivity({
        user,
        action: 'password_reset_request',
        details: 'Password reset requested',
        ipAddress: req.ip,
      });
    }
    res.json({ message: 'If that email is registered, you will receive a password reset link.' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token) return next(createError(400, 'Reset token is required.'));
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match.',
        errors: [{ field: 'confirmPassword', message: 'Passwords do not match.' }],
      });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');
    if (!user) return next(createError(400, 'Invalid or expired reset token.'));
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};
