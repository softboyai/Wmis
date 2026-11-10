import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userEmail: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login', 'logout', 'login_failed', 'account_locked',
        'create', 'update', 'delete', 'approve', 'reject', 'dispatch',
        'password_change', 'password_reset_request', 'user_deactivated', 'user_activated',
      ],
    },
    resource: {
      type: String,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
      maxlength: 1000,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
