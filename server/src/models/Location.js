import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    zone: {
      type: String,
      required: [true, 'Zone is required'],
      trim: true,
      uppercase: true,
    },
    rack: {
      type: String,
      required: [true, 'Rack is required'],
      trim: true,
      uppercase: true,
    },
    bin: {
      type: String,
      required: [true, 'Bin is required'],
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

locationSchema.index({ zone: 1, rack: 1, bin: 1 }, { unique: true });

const Location = mongoose.model('Location', locationSchema);
export default Location;
