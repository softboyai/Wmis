import mongoose from 'mongoose';
import DispatchOrder from '../models/DispatchOrder.js';
import Stock from '../models/Stock.js';
import StockMovement from '../models/StockMovement.js';
import { createError } from '../utils/errors.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { dispatchOrderSchema, rejectDispatchSchema } from '../validators/schemas.js';

export const getDispatches = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, product: productId, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (productId) filter.product = productId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const [dispatches, total] = await Promise.all([
      DispatchOrder.find(filter)
        .populate('product', 'name sku unit')
        .populate('client', 'name')
        .populate('requestedBy', 'fullName email')
        .populate('approvedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DispatchOrder.countDocuments(filter),
    ]);
    res.json(paginatedResponse(dispatches, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getDispatch = async (req, res, next) => {
  try {
    const dispatch = await DispatchOrder.findById(req.params.id)
      .populate('product', 'name sku unit')
      .populate('client', 'name')
      .populate('requestedBy', 'fullName email')
      .populate('approvedBy', 'fullName');
    if (!dispatch) return next(createError(404, 'Dispatch order not found.'));
    res.json({ data: dispatch });
  } catch (err) {
    next(err);
  }
};

export const createDispatch = async (req, res, next) => {
  try {
    const result = dispatchOrderSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const { product, client, quantity, notes } = result.data;
    const dispatch = await DispatchOrder.create({
      product, client, quantity, notes,
      requestedBy: req.user._id,
      status: 'pending',
    });
    await logActivity({
      user: req.user, action: 'create', resource: 'DispatchOrder', resourceId: dispatch._id,
      details: `Created dispatch request: ${quantity} units of product ${product} for client ${client}`,
      ipAddress: req.ip,
    });
    const populated = await DispatchOrder.findById(dispatch._id)
      .populate('product', 'name sku unit')
      .populate('client', 'name')
      .populate('requestedBy', 'fullName');
    res.status(201).json({ data: populated });
  } catch (err) {
    next(err);
  }
};

export const approveDispatch = async (req, res, next) => {
  try {
    const dispatch = await DispatchOrder.findById(req.params.id).populate('product', 'name sku');
    if (!dispatch) return next(createError(404, 'Dispatch order not found.'));
    if (dispatch.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve a dispatch that is already ${dispatch.status}.` });
    }

    // Check total available stock across all locations
    const stockAgg = await Stock.aggregate([
      { $match: { product: dispatch.product._id } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalStock = stockAgg[0]?.total || 0;
    if (totalStock < dispatch.quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${totalStock} units, Requested: ${dispatch.quantity} units. Cannot approve this dispatch.`,
      });
    }

    dispatch.status = 'approved';
    dispatch.approvedBy = req.user._id;
    dispatch.approvedAt = new Date();
    await dispatch.save();

    await logActivity({
      user: req.user, action: 'approve', resource: 'DispatchOrder', resourceId: dispatch._id,
      details: `Approved dispatch order for ${dispatch.quantity} units of ${dispatch.product.name}`,
      ipAddress: req.ip,
    });
    const populated = await DispatchOrder.findById(dispatch._id)
      .populate('product', 'name sku unit')
      .populate('client', 'name')
      .populate('requestedBy', 'fullName')
      .populate('approvedBy', 'fullName');
    res.json({ data: populated });
  } catch (err) {
    next(err);
  }
};

export const rejectDispatch = async (req, res, next) => {
  try {
    const result = rejectDispatchSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const dispatch = await DispatchOrder.findById(req.params.id).populate('product', 'name sku');
    if (!dispatch) return next(createError(404, 'Dispatch order not found.'));
    if (dispatch.status !== 'pending') {
      return res.status(400).json({ message: `Cannot reject a dispatch that is already ${dispatch.status}.` });
    }
    dispatch.status = 'rejected';
    dispatch.rejectionReason = result.data.reason;
    await dispatch.save();
    await logActivity({
      user: req.user, action: 'reject', resource: 'DispatchOrder', resourceId: dispatch._id,
      details: `Rejected dispatch order: ${result.data.reason}`,
      ipAddress: req.ip,
    });
    res.json({ data: dispatch });
  } catch (err) {
    next(err);
  }
};

export const dispatchOrder = async (req, res, next) => {
  try {
    const dispatchDoc = await DispatchOrder.findById(req.params.id).populate('product', 'name sku');
    if (!dispatchDoc) return next(createError(404, 'Dispatch order not found.'));
    if (dispatchDoc.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved dispatches can be dispatched.' });
    }

    // Deduct stock atomically — pick locations with stock, deduct in order
    let session;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }

    try {
      const stockEntries = await Stock.find({ product: dispatchDoc.product._id, quantity: { $gt: 0 } })
        .sort({ quantity: -1 });
      let remaining = dispatchDoc.quantity;
      const totalAvailable = stockEntries.reduce((sum, s) => sum + s.quantity, 0);

      if (totalAvailable < dispatchDoc.quantity) {
        if (session) await session.abortTransaction();
        return res.status(400).json({
          message: `Insufficient stock. Available: ${totalAvailable} units, Required: ${dispatchDoc.quantity} units.`,
        });
      }

      for (const stock of stockEntries) {
        if (remaining <= 0) break;
        const deduct = Math.min(stock.quantity, remaining);
        const balanceBefore = stock.quantity;
        const balanceAfter = balanceBefore - deduct;

        await Stock.findByIdAndUpdate(stock._id, { $inc: { quantity: -deduct } }, { session: session || undefined });

        await StockMovement.create(
          [{
            product: dispatchDoc.product._id,
            location: stock.location,
            type: 'dispatch',
            quantity: -deduct,
            balanceBefore,
            balanceAfter,
            reference: dispatchDoc._id,
            referenceModel: 'DispatchOrder',
            performedBy: req.user._id,
          }],
          session ? { session } : {}
        );
        remaining -= deduct;
      }

      dispatchDoc.status = 'dispatched';
      dispatchDoc.dispatchedAt = new Date();
      await dispatchDoc.save({ session: session || undefined });

      if (session) await session.commitTransaction();

      await logActivity({
        user: req.user, action: 'dispatch', resource: 'DispatchOrder', resourceId: dispatchDoc._id,
        details: `Dispatched ${dispatchDoc.quantity} units of ${dispatchDoc.product.name}`,
        ipAddress: req.ip,
      });

      const populated = await DispatchOrder.findById(dispatchDoc._id)
        .populate('product', 'name sku unit')
        .populate('client', 'name')
        .populate('requestedBy', 'fullName')
        .populate('approvedBy', 'fullName');
      res.json({ data: populated });
    } catch (err) {
      if (session) await session.abortTransaction();
      throw err;
    } finally {
      if (session) session.endSession();
    }
  } catch (err) {
    next(err);
  }
};
