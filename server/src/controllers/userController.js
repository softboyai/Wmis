import User from '../models/User.js';
import { createError } from '../utils/errors.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { registerUserSchema } from '../validators/schemas.js';

export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, role, isActive } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json(paginatedResponse(users, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const result = registerUserSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const { fullName, email, password, role } = result.data;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        message: 'This email is already registered.',
        errors: [{ field: 'email', message: 'This email is already registered.' }],
      });
    }
    const user = await User.create({ fullName, email, password, role });
    await logActivity({
      user: req.user,
      action: 'create',
      resource: 'User',
      resourceId: user._id,
      details: `Created user ${user.email} with role ${user.role}`,
      ipAddress: req.ip,
    });
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, role, isActive } = req.body;

    if (id === req.user._id.toString()) {
      if (isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate your own account.' });
      }
      if (role && role !== req.user.role) {
        return res.status(400).json({ message: 'You cannot change your own role.' });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { ...(fullName && { fullName }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
      { new: true, runValidators: true }
    );
    if (!user) return next(createError(404, 'User not found.'));

    if (isActive === false) {
      await logActivity({
        user: req.user,
        action: 'user_deactivated',
        resource: 'User',
        resourceId: user._id,
        details: `Deactivated user ${user.email}`,
        ipAddress: req.ip,
      });
    } else {
      await logActivity({
        user: req.user,
        action: 'update',
        resource: 'User',
        resourceId: user._id,
        details: `Updated user ${user.email}`,
        ipAddress: req.ip,
      });
    }
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    const user = await User.findById(id);
    if (!user) return next(createError(404, 'User not found.'));
    user.password = newPassword;
    await user.save();
    await logActivity({
      user: req.user,
      action: 'password_change',
      resource: 'User',
      resourceId: user._id,
      details: `Admin reset password for ${user.email}`,
      ipAddress: req.ip,
    });
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found.'));
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};
