import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({
  user,
  action,
  resource,
  resourceId,
  details,
  ipAddress,
}) => {
  try {
    await ActivityLog.create({
      user: user?._id || user,
      userEmail: user?.email,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
    });
  } catch (err) {
    // Activity logging should never crash the main flow
    console.error('Activity log error:', err.message);
  }
};
