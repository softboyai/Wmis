import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import DispatchOrder from '../models/DispatchOrder.js';
import StockMovement from '../models/StockMovement.js';
import ActivityLog from '../models/ActivityLog.js';
import GoodsReceipt from '../models/GoodsReceipt.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      stockAgg,
      products,
      pendingDispatches,
      recentActivity,
      movementsChart,
      recentReceipts,
    ] = await Promise.all([
      Product.countDocuments({ isDeleted: false }),
      Stock.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]),
      Product.find({ isDeleted: false }).select('_id minimumStock'),
      DispatchOrder.countDocuments({ status: 'pending' }),
      ActivityLog.find({}).populate('user', 'fullName email').sort({ createdAt: -1 }).limit(10),
      StockMovement.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type',
            },
            count: { $sum: 1 },
            quantity: { $sum: { $abs: '$quantity' } },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
      GoodsReceipt.find({}).sort({ createdAt: -1 }).limit(5)
        .populate('product', 'name sku')
        .populate('supplier', 'name'),
    ]);

    // Calculate low stock
    const productIds = products.map((p) => p._id);
    const stockMap = await Stock.aggregate([
      { $match: { product: { $in: productIds } } },
      { $group: { _id: '$product', total: { $sum: '$quantity' } } },
    ]);
    const stockByProduct = {};
    stockMap.forEach((s) => { stockByProduct[s._id.toString()] = s.total; });

    const lowStockProducts = await Product.find({ isDeleted: false }).then((prods) =>
      prods.filter((p) => (stockByProduct[p._id.toString()] || 0) <= p.minimumStock).slice(0, 10)
    );

    const lowStockWithQuantity = await Promise.all(
      lowStockProducts.map(async (p) => ({
        ...p.toObject(),
        currentStock: stockByProduct[p._id.toString()] || 0,
      }))
    );

    res.json({
      stats: {
        totalProducts,
        totalUnitsInStock: stockAgg[0]?.total || 0,
        lowStockCount: lowStockProducts.length,
        pendingDispatches,
      },
      movementsChart,
      recentActivity,
      lowStockAlerts: lowStockWithQuantity,
      recentReceipts,
    });
  } catch (err) {
    next(err);
  }
};
