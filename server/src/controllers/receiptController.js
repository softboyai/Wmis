import mongoose from 'mongoose';
import GoodsReceipt from '../models/GoodsReceipt.js';
import Stock from '../models/Stock.js';
import StockMovement from '../models/StockMovement.js';
import Product from '../models/Product.js';
import { createError } from '../utils/errors.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { goodsReceiptSchema } from '../validators/schemas.js';

export const getReceipts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, startDate, endDate, product: productId } = req.query;
    const filter = {};
    if (productId) filter.product = productId;
    if (startDate || endDate) {
      filter.receiptDate = {};
      if (startDate) filter.receiptDate.$gte = new Date(startDate);
      if (endDate) filter.receiptDate.$lte = new Date(endDate);
    }
    const [receipts, total] = await Promise.all([
      GoodsReceipt.find(filter)
        .populate('product', 'name sku unit')
        .populate('supplier', 'name')
        .populate('location', 'zone rack bin')
        .populate('receivedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      GoodsReceipt.countDocuments(filter),
    ]);
    res.json(paginatedResponse(receipts, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const createReceipt = async (req, res, next) => {
  try {
    const result = goodsReceiptSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const { product, supplier, location, quantity, referenceNote, receiptDate } = result.data;

    // Try to use a session for atomicity
    let session;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }

    try {
      const receiptData = {
        product,
        supplier,
        location,
        quantity,
        referenceNote,
        receiptDate: new Date(receiptDate),
        receivedBy: req.user._id,
      };

      let receipt;
      if (session) {
        [receipt] = await GoodsReceipt.create([receiptData], { session });
      } else {
        receipt = await GoodsReceipt.create(receiptData);
      }

      // Get current stock balance before update
      const existing = await Stock.findOne({ product, location });
      const balanceBefore = existing?.quantity || 0;
      const balanceAfter = balanceBefore + quantity;

      // Atomic upsert stock
      await Stock.findOneAndUpdate(
        { product, location },
        { $inc: { quantity } },
        { upsert: true, session: session || undefined }
      );

      await StockMovement.create(
        [{
          product,
          location,
          type: 'receipt',
          quantity,
          balanceBefore,
          balanceAfter,
          reference: receipt._id,
          referenceModel: 'GoodsReceipt',
          performedBy: req.user._id,
        }],
        session ? { session } : {}
      );

      if (session) await session.commitTransaction();

      await logActivity({
        user: req.user, action: 'create', resource: 'GoodsReceipt', resourceId: receipt._id,
        details: `Goods received: ${quantity} units of product ${product} at location ${location}`,
        ipAddress: req.ip,
      });

      const populated = await GoodsReceipt.findById(receipt._id)
        .populate('product', 'name sku unit')
        .populate('supplier', 'name')
        .populate('location', 'zone rack bin')
        .populate('receivedBy', 'fullName');

      res.status(201).json({ data: populated });
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

export const getReceipt = async (req, res, next) => {
  try {
    const receipt = await GoodsReceipt.findById(req.params.id)
      .populate('product', 'name sku unit')
      .populate('supplier', 'name')
      .populate('location', 'zone rack bin')
      .populate('receivedBy', 'fullName email');
    if (!receipt) return next(createError(404, 'Receipt not found.'));
    res.json({ data: receipt });
  } catch (err) {
    next(err);
  }
};
