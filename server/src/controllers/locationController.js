import Location from '../models/Location.js';
import Stock from '../models/Stock.js';
import { createError } from '../utils/errors.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { locationSchema } from '../validators/schemas.js';

export const getLocations = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, zone } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { zone: { $regex: search, $options: 'i' } },
      { rack: { $regex: search, $options: 'i' } },
      { bin: { $regex: search, $options: 'i' } },
    ];
    if (zone) filter.zone = zone.toUpperCase();
    const [locations, total] = await Promise.all([
      Location.find(filter).sort({ zone: 1, rack: 1, bin: 1 }).skip(skip).limit(limit),
      Location.countDocuments(filter),
    ]);

    // Calculate occupancy for each location
    const locationIds = locations.map((l) => l._id);
    const stocks = await Stock.aggregate([
      { $match: { location: { $in: locationIds } } },
      { $group: { _id: '$location', totalQuantity: { $sum: '$quantity' } } },
    ]);
    const stockMap = {};
    stocks.forEach((s) => { stockMap[s._id.toString()] = s.totalQuantity; });

    const enriched = locations.map((loc) => ({
      ...loc.toObject(),
      occupancy: stockMap[loc._id.toString()] || 0,
    }));

    res.json(paginatedResponse(enriched, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return next(createError(404, 'Location not found.'));
    const stock = await Stock.aggregate([
      { $match: { location: location._id } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    res.json({ data: { ...location.toObject(), occupancy: stock[0]?.total || 0 } });
  } catch (err) {
    next(err);
  }
};

export const createLocation = async (req, res, next) => {
  try {
    const result = locationSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const existing = await Location.findOne({ zone: result.data.zone, rack: result.data.rack, bin: result.data.bin });
    if (existing) {
      return res.status(409).json({
        message: 'A location with this Zone/Rack/Bin already exists.',
        errors: [{ field: 'bin', message: 'A location with this Zone/Rack/Bin already exists.' }],
      });
    }
    const location = await Location.create(result.data);
    await logActivity({
      user: req.user, action: 'create', resource: 'Location', resourceId: location._id,
      details: `Created location ${location.zone}-${location.rack}-${location.bin}`, ipAddress: req.ip,
    });
    res.status(201).json({ data: location });
  } catch (err) {
    next(err);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const result = locationSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const existing = await Location.findOne({
      zone: result.data.zone, rack: result.data.rack, bin: result.data.bin, _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(409).json({
        message: 'A location with this Zone/Rack/Bin already exists.',
        errors: [{ field: 'bin', message: 'A location with this Zone/Rack/Bin already exists.' }],
      });
    }
    const location = await Location.findByIdAndUpdate(req.params.id, result.data, { new: true });
    if (!location) return next(createError(404, 'Location not found.'));
    await logActivity({
      user: req.user, action: 'update', resource: 'Location', resourceId: location._id,
      details: `Updated location ${location.zone}-${location.rack}-${location.bin}`, ipAddress: req.ip,
    });
    res.json({ data: location });
  } catch (err) {
    next(err);
  }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) return next(createError(404, 'Location not found.'));
    await logActivity({
      user: req.user, action: 'delete', resource: 'Location', resourceId: location._id,
      details: `Deleted location ${location.zone}-${location.rack}-${location.bin}`, ipAddress: req.ip,
    });
    res.json({ message: 'Location deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
