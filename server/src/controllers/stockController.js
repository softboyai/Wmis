import Stock from '../models/Stock.js';
import StockMovement from '../models/StockMovement.js';
import Product from '../models/Product.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';

export const getStock = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, category, lowStock, location: locationId } = req.query;

    // Build product filter
    const productFilter = { isDeleted: false };
    if (search) productFilter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
    if (category) productFilter.category = category;

    const products = await Product.find(productFilter).select('_id name sku category unit minimumStock');
    const productIds = products.map((p) => p._id);

    const matchFilter = { product: { $in: productIds } };
    if (locationId) matchFilter.location = locationId;

    // Aggregate stock per product
    const stockAgg = await Stock.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          locations: {
            $push: { location: '$location', quantity: '$quantity' },
          },
        },
      },
    ]);
    const stockMap = {};
    stockAgg.forEach((s) => { stockMap[s._id.toString()] = s; });

    let result = products.map((p) => {
      const stockData = stockMap[p._id.toString()];
      const totalQuantity = stockData?.totalQuantity || 0;
      return {
        product: p,
        totalQuantity,
        minimumStock: p.minimumStock,
        isLowStock: totalQuantity <= p.minimumStock,
        isOutOfStock: totalQuantity === 0,
      };
    });

    if (lowStock === 'true') {
      result = result.filter((r) => r.isLowStock);
    }

    const total = result.length;
    const paginated = result.slice(skip, skip + limit);

    res.json(paginatedResponse(paginated, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getStockByLocation = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.location) filter.location = req.query.location;
    if (req.query.product) filter.product = req.query.product;

    const [stocks, total] = await Promise.all([
      Stock.find(filter)
        .populate('product', 'name sku unit category minimumStock')
        .populate('location', 'zone rack bin capacity')
        .skip(skip)
        .limit(limit),
      Stock.countDocuments(filter),
    ]);
    res.json(paginatedResponse(stocks, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getMovements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { type, product: productId, startDate, endDate } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (productId) filter.product = productId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('product', 'name sku unit')
        .populate('location', 'zone rack bin')
        .populate('performedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockMovement.countDocuments(filter),
    ]);
    res.json(paginatedResponse(movements, total, page, limit));
  } catch (err) {
    next(err);
  }
};
