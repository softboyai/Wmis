import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import { createError } from '../utils/errors.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { productSchema } from '../validators/schemas.js';

export const getProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, category, sort = '-createdAt' } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
    if (category) filter.category = category;

    const [products, total] = await Promise.all([
      Product.find(filter).populate('supplier', 'name').sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json(paginatedResponse(products, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false }).populate('supplier', 'name');
    if (!product) return next(createError(404, 'Product not found.'));
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const result = productSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const existing = await Product.findOne({ sku: result.data.sku });
    if (existing) {
      return res.status(409).json({
        message: 'This SKU is already in use.',
        errors: [{ field: 'sku', message: 'This SKU is already in use.' }],
      });
    }
    const product = await Product.create(result.data);
    await logActivity({
      user: req.user,
      action: 'create',
      resource: 'Product',
      resourceId: product._id,
      details: `Created product ${product.name} (${product.sku})`,
      ipAddress: req.ip,
    });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const result = productSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const existing = await Product.findOne({ sku: result.data.sku, _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(409).json({
        message: 'This SKU is already in use.',
        errors: [{ field: 'sku', message: 'This SKU is already in use.' }],
      });
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      result.data,
      { new: true, runValidators: true }
    );
    if (!product) return next(createError(404, 'Product not found.'));
    await logActivity({
      user: req.user,
      action: 'update',
      resource: 'Product',
      resourceId: product._id,
      details: `Updated product ${product.name}`,
      ipAddress: req.ip,
    });
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!product) return next(createError(404, 'Product not found.'));
    await logActivity({
      user: req.user,
      action: 'delete',
      resource: 'Product',
      resourceId: product._id,
      details: `Deleted product ${product.name}`,
      ipAddress: req.ip,
    });
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isDeleted: false });
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
};
