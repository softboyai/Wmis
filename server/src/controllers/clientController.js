import Client from '../models/Client.js';
import { createError } from '../utils/errors.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { clientSchema, normalizePhone } from '../validators/schemas.js';

export const getClients = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, isActive } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const [clients, total] = await Promise.all([
      Client.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Client.countDocuments(filter),
    ]);
    res.json(paginatedResponse(clients, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return next(createError(404, 'Client not found.'));
    res.json({ data: client });
  } catch (err) {
    next(err);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const result = clientSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const data = result.data;
    if (data.phone) data.phone = normalizePhone(data.phone);
    const client = await Client.create(data);
    await logActivity({
      user: req.user, action: 'create', resource: 'Client', resourceId: client._id,
      details: `Created client ${client.name}`, ipAddress: req.ip,
    });
    res.status(201).json({ data: client });
  } catch (err) {
    next(err);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const result = clientSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const data = result.data;
    if (data.phone) data.phone = normalizePhone(data.phone);
    const client = await Client.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!client) return next(createError(404, 'Client not found.'));
    await logActivity({
      user: req.user, action: 'update', resource: 'Client', resourceId: client._id,
      details: `Updated client ${client.name}`, ipAddress: req.ip,
    });
    res.json({ data: client });
  } catch (err) {
    next(err);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return next(createError(404, 'Client not found.'));
    await logActivity({
      user: req.user, action: 'delete', resource: 'Client', resourceId: client._id,
      details: `Deleted client ${client.name}`, ipAddress: req.ip,
    });
    res.json({ message: 'Client deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
