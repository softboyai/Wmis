import ActivityLog from '../models/ActivityLog.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';

export const getLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { action, startDate, endDate, user: userId } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.user = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('user', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);
    res.json(paginatedResponse(logs, total, page, limit));
  } catch (err) {
    next(err);
  }
};
