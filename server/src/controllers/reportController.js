import PDFDocument from 'pdfkit';
import Stock from '../models/Stock.js';
import Product from '../models/Product.js';
import GoodsReceipt from '../models/GoodsReceipt.js';
import DispatchOrder from '../models/DispatchOrder.js';
import StockMovement from '../models/StockMovement.js';

const buildFilter = (query) => {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59));
  }
  if (query.location) filter.location = query.location;
  return filter;
};

const toCsv = (headers, rows) => {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const lines = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))];
  return lines.join('\n');
};

export const getStockReport = async (req, res, next) => {
  try {
    const { format, category, location: locationId } = req.query;
    const productFilter = { isDeleted: false };
    if (category) productFilter.category = category;
    const products = await Product.find(productFilter).populate('supplier', 'name');
    const productIds = products.map((p) => p._id);

    const matchFilter = { product: { $in: productIds } };
    if (locationId) matchFilter.location = locationId;

    const stockAgg = await Stock.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$product', totalQuantity: { $sum: '$quantity' } } },
    ]);
    const stockMap = {};
    stockAgg.forEach((s) => { stockMap[s._id.toString()] = s.totalQuantity; });

    const rows = products.map((p) => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      supplier: p.supplier?.name || '-',
      currentStock: stockMap[p._id.toString()] || 0,
      minimumStock: p.minimumStock,
      status:
        (stockMap[p._id.toString()] || 0) === 0
          ? 'Out of Stock'
          : (stockMap[p._id.toString()] || 0) <= p.minimumStock
          ? 'Low Stock'
          : 'In Stock',
    }));

    if (format === 'csv') {
      const headers = ['Product Name', 'SKU', 'Category', 'Unit', 'Supplier', 'Current Stock', 'Min Stock', 'Status'];
      const csvRows = rows.map((r) => [r.name, r.sku, r.category, r.unit, r.supplier, r.currentStock, r.minimumStock, r.status]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="stock-report.csv"');
      return res.send(toCsv(headers, csvRows));
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="stock-report.pdf"');
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      doc.pipe(res);
      doc.fontSize(18).text('AGL Rwanda - Stock Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      const cols = ['Product', 'SKU', 'Category', 'Unit', 'Current Stock', 'Min Stock', 'Status'];
      const colWidths = [150, 70, 80, 50, 70, 60, 70];
      let x = 40, y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      cols.forEach((col, i) => { doc.text(col, x, y, { width: colWidths[i] }); x += colWidths[i]; });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8);
      rows.forEach((row) => {
        x = 40; y = doc.y;
        if (y > 540) { doc.addPage(); y = 40; }
        [row.name, row.sku, row.category, row.unit, String(row.currentStock), String(row.minimumStock), row.status].forEach((val, i) => {
          doc.text(val, x, y, { width: colWidths[i] });
          x += colWidths[i];
        });
        doc.moveDown(0.3);
      });
      doc.end();
      return;
    }

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
};

export const getReceiptsReport = async (req, res, next) => {
  try {
    const { format, category } = req.query;
    const filter = buildFilter(req.query);
    const receipts = await GoodsReceipt.find(filter)
      .populate('product', 'name sku category unit')
      .populate('supplier', 'name')
      .populate('location', 'zone rack bin')
      .populate('receivedBy', 'fullName')
      .sort({ createdAt: -1 });

    let filtered = receipts;
    if (category) filtered = receipts.filter((r) => r.product?.category === category);

    if (format === 'csv') {
      const headers = ['Date', 'Product', 'SKU', 'Category', 'Supplier', 'Location', 'Quantity', 'Received By', 'Reference'];
      const rows = filtered.map((r) => [
        new Date(r.receiptDate).toLocaleDateString(),
        r.product?.name || '', r.product?.sku || '', r.product?.category || '',
        r.supplier?.name || '',
        r.location ? `${r.location.zone}-${r.location.rack}-${r.location.bin}` : '',
        r.quantity, r.receivedBy?.fullName || '', r.referenceNote || '',
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="receipts-report.csv"');
      return res.send(toCsv(headers, rows));
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="receipts-report.pdf"');
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      doc.pipe(res);
      doc.fontSize(18).text('AGL Rwanda - Goods Receipts Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(9).font('Helvetica-Bold');
      const cols = ['Date', 'Product', 'SKU', 'Supplier', 'Location', 'Qty', 'Received By'];
      const widths = [70, 130, 70, 100, 80, 40, 100];
      let x = 40; let y = doc.y;
      cols.forEach((c, i) => { doc.text(c, x, y, { width: widths[i] }); x += widths[i]; });
      doc.moveDown(0.5); doc.font('Helvetica').fontSize(8);
      filtered.forEach((r) => {
        x = 40; y = doc.y;
        if (y > 540) { doc.addPage(); y = 40; }
        [
          new Date(r.receiptDate).toLocaleDateString(),
          r.product?.name || '', r.product?.sku || '', r.supplier?.name || '',
          r.location ? `${r.location.zone}-${r.location.rack}-${r.location.bin}` : '',
          String(r.quantity), r.receivedBy?.fullName || '',
        ].forEach((v, i) => { doc.text(v, x, y, { width: widths[i] }); x += widths[i]; });
        doc.moveDown(0.3);
      });
      doc.end();
      return;
    }
    res.json({ data: filtered, total: filtered.length });
  } catch (err) {
    next(err);
  }
};

export const getDispatchesReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const filter = buildFilter(req.query);
    if (req.query.status) filter.status = req.query.status;
    const dispatches = await DispatchOrder.find(filter)
      .populate('product', 'name sku category unit')
      .populate('client', 'name')
      .populate('requestedBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const headers = ['Date', 'Product', 'SKU', 'Client', 'Quantity', 'Status', 'Requested By', 'Approved By', 'Notes'];
      const rows = dispatches.map((d) => [
        new Date(d.createdAt).toLocaleDateString(),
        d.product?.name || '', d.product?.sku || '', d.client?.name || '',
        d.quantity, d.status, d.requestedBy?.fullName || '', d.approvedBy?.fullName || '',
        d.notes || d.rejectionReason || '',
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="dispatches-report.csv"');
      return res.send(toCsv(headers, rows));
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="dispatches-report.pdf"');
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      doc.pipe(res);
      doc.fontSize(18).text('AGL Rwanda - Dispatch Orders Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(9).font('Helvetica-Bold');
      const cols = ['Date', 'Product', 'SKU', 'Client', 'Qty', 'Status', 'Requested By'];
      const widths = [70, 130, 70, 100, 40, 70, 110];
      let x = 40; let y = doc.y;
      cols.forEach((c, i) => { doc.text(c, x, y, { width: widths[i] }); x += widths[i]; });
      doc.moveDown(0.5); doc.font('Helvetica').fontSize(8);
      dispatches.forEach((d) => {
        x = 40; y = doc.y;
        if (y > 540) { doc.addPage(); y = 40; }
        [
          new Date(d.createdAt).toLocaleDateString(),
          d.product?.name || '', d.product?.sku || '', d.client?.name || '',
          String(d.quantity), d.status, d.requestedBy?.fullName || '',
        ].forEach((v, i) => { doc.text(v, x, y, { width: widths[i] }); x += widths[i]; });
        doc.moveDown(0.3);
      });
      doc.end();
      return;
    }
    res.json({ data: dispatches, total: dispatches.length });
  } catch (err) {
    next(err);
  }
};
