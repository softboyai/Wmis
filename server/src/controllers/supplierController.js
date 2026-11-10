import Supplier from '../models/Supplier.js';
import { createError } from '../utils/errors.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { supplierSchema } from '../validators/schemas.js';
import { normalizePhone } from '../validators/schemas.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, isActive } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const [suppliers, total] = await Promise.all([
      Supplier.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Supplier.countDocuments(filter),
    ]);
    res.json(paginatedResponse(suppliers, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return next(createError(404, 'Supplier not found.'));
    res.json({ data: supplier });
  } catch (err) {
    next(err);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const result = supplierSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const data = result.data;
    if (data.phone) data.phone = normalizePhone(data.phone);
    const supplier = await Supplier.create(data);
    await logActivity({
      user: req.user,
      action: 'create',
      resource: 'Supplier',
      resourceId: supplier._id,
      details: `Created supplier ${supplier.name}`,
      ipAddress: req.ip,
    });
    res.status(201).json({ data: supplier });
  } catch (err) {
    next(err);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const result = supplierSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const data = result.data;
    if (data.phone) data.phone = normalizePhone(data.phone);
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!supplier) return next(createError(404, 'Supplier not found.'));
    await logActivity({
      user: req.user,
      action: 'update',
      resource: 'Supplier',
      resourceId: supplier._id,
      details: `Updated supplier ${supplier.name}`,
      ipAddress: req.ip,
    });
    res.json({ data: supplier });
  } catch (err) {
    next(err);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return next(createError(404, 'Supplier not found.'));
    await logActivity({
      user: req.user,
      action: 'delete',
      resource: 'Supplier',
      resourceId: supplier._id,
      details: `Deleted supplier ${supplier.name}`,
      ipAddress: req.ip,
    });
    res.json({ message: 'Supplier deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
