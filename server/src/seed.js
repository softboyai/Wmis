import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Supplier from './models/Supplier.js';
import Client from './models/Client.js';
import Location from './models/Location.js';
import Stock from './models/Stock.js';
import GoodsReceipt from './models/GoodsReceipt.js';
import DispatchOrder from './models/DispatchOrder.js';
import StockMovement from './models/StockMovement.js';
import ActivityLog from './models/ActivityLog.js';

const getSeedPasswords = () => {
  const passwords = {
    administrator: process.env.SEED_ADMIN_PASSWORD,
    manager: process.env.SEED_MANAGER_PASSWORD,
    storekeeper: process.env.SEED_STOREKEEPER_PASSWORD,
  };
  const missing = Object.entries(passwords)
    .filter(([, password]) => !password || password.length < 8)
    .map(([role]) => role);

  if (missing.length) {
    throw new Error(`Set a password of at least 8 characters for: ${missing.join(', ')} in .env.`);
  }

  return passwords;
};

const seed = async () => {
  const seedPasswords = getSeedPasswords();
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}), Supplier.deleteMany({}),
    Client.deleteMany({}), Location.deleteMany({}), Stock.deleteMany({}),
    GoodsReceipt.deleteMany({}), DispatchOrder.deleteMany({}),
    StockMovement.deleteMany({}), ActivityLog.deleteMany({}),
  ]);
  console.log('✅ Cleared existing data');

  // Users
  const [admin, manager, storekeeper] = await User.create([
    { fullName: 'Alice Uwimana', email: 'admin@aglrwanda.com', password: seedPasswords.administrator, role: 'administrator' },
    { fullName: 'Bob Nkurunziza', email: 'manager@aglrwanda.com', password: seedPasswords.manager, role: 'manager' },
    { fullName: 'Claire Mukamana', email: 'storekeeper@aglrwanda.com', password: seedPasswords.storekeeper, role: 'storekeeper' },
  ]);
  console.log('✅ Users created');

  // Suppliers
  const suppliers = await Supplier.create([
    { name: 'Rwanda Building Materials Ltd', email: 'info@rbml.rw', phone: '+250788123456', address: 'KG 123 St, Kigali', contactPerson: 'Jean Pierre Habimana' },
    { name: 'East Africa Logistics Co', email: 'supply@ealogistics.co', phone: '+250722345678', address: 'KN 45 Ave, Kigali', contactPerson: 'Grace Niyobuhungiro' },
    { name: 'Kigali Industrial Supplies', email: 'orders@kis.rw', phone: '+250738901234', address: 'KK 7 Rd, Kigali', contactPerson: 'Patrick Ruzindana' },
    { name: 'Pan Africa Trading Company', email: 'trade@patco.africa', phone: '+250729876543', address: 'KG 88 Blvd, Kigali', contactPerson: 'Annette Uwase' },
  ]);
  console.log('✅ Suppliers created');

  // Clients
  const clients = await Client.create([
    { name: 'Kigali City Council', email: 'procurement@kcc.gov.rw', phone: '+250788001122', address: 'City Hall, Kigali', contactPerson: 'Martin Bizimana' },
    { name: 'Rwanda Infrastructure Authority', email: 'logistics@ria.gov.rw', phone: '+250722334455', address: 'Kimihurura, Kigali', contactPerson: 'Sandrine Murekatete' },
    { name: 'Horizon Construction Ltd', email: 'site@horizonconstruct.rw', phone: '+250738990011', address: 'Gisozi, Kigali', contactPerson: 'Emmanuel Nzeyimana' },
    { name: 'Bralirwa Distribution', email: 'dist@bralirwa.rw', phone: '+250729112233', address: 'Gisenyi Rd, Kigali', contactPerson: 'Chantal Ingabire' },
  ]);
  console.log('✅ Clients created');

  // Locations
  const locations = await Location.create([
    { zone: 'A', rack: 'R1', bin: 'B1', capacity: 500, description: 'Heavy equipment zone' },
    { zone: 'A', rack: 'R1', bin: 'B2', capacity: 500, description: 'Heavy equipment zone' },
    { zone: 'A', rack: 'R2', bin: 'B1', capacity: 300, description: 'Medium items rack' },
    { zone: 'A', rack: 'R2', bin: 'B2', capacity: 300, description: 'Medium items rack' },
    { zone: 'B', rack: 'R1', bin: 'B1', capacity: 1000, description: 'Bulk storage' },
    { zone: 'B', rack: 'R1', bin: 'B2', capacity: 1000, description: 'Bulk storage' },
    { zone: 'B', rack: 'R2', bin: 'B1', capacity: 200, description: 'Small items' },
    { zone: 'B', rack: 'R2', bin: 'B2', capacity: 200, description: 'Small items' },
    { zone: 'C', rack: 'R1', bin: 'B1', capacity: 400, description: 'Refrigerated zone' },
    { zone: 'C', rack: 'R1', bin: 'B2', capacity: 400, description: 'Refrigerated zone' },
    { zone: 'C', rack: 'R2', bin: 'B1', capacity: 150, description: 'Fragile items' },
    { zone: 'C', rack: 'R2', bin: 'B2', capacity: 150, description: 'Fragile items' },
  ]);
  console.log('✅ Locations created');

  // Products
  const products = await Product.create([
    { name: 'Portland Cement 50kg', sku: 'CEM-001', category: 'Construction', unit: 'bags', minimumStock: 50, supplier: suppliers[0]._id, description: 'Standard Portland cement bags' },
    { name: 'Steel Reinforcement Bar 12mm', sku: 'STL-012', category: 'Construction', unit: 'pieces', minimumStock: 100, supplier: suppliers[0]._id, description: '12mm diameter rebar 6m length' },
    { name: 'PVC Water Pipe 50mm x 6m', sku: 'PVC-050', category: 'Plumbing', unit: 'pieces', minimumStock: 30, supplier: suppliers[2]._id, description: 'PVC pressure pipe' },
    { name: 'Electrical Cable 2.5mm²', sku: 'ELC-025', category: 'Electrical', unit: 'meters', minimumStock: 200, supplier: suppliers[1]._id, description: 'Single core copper cable' },
    { name: 'Safety Helmet Class A', sku: 'SAF-H01', category: 'Safety', unit: 'pieces', minimumStock: 20, supplier: suppliers[3]._id, description: 'ANSI approved hard hat' },
    { name: 'Reflective Safety Vest', sku: 'SAF-V01', category: 'Safety', unit: 'pieces', minimumStock: 25, supplier: suppliers[3]._id, description: 'High-visibility vest Class 2' },
    { name: 'Diesel Engine Oil 15W-40 20L', sku: 'OIL-D20', category: 'Lubricants', unit: 'drums', minimumStock: 10, supplier: suppliers[1]._id, description: 'Heavy-duty diesel engine oil' },
    { name: 'Hydraulic Fluid ISO 46 20L', sku: 'OIL-H20', category: 'Lubricants', unit: 'drums', minimumStock: 8, supplier: suppliers[1]._id, description: 'Anti-wear hydraulic fluid' },
    { name: 'Plywood Sheet 18mm 1220x2440', sku: 'PLY-018', category: 'Construction', unit: 'sheets', minimumStock: 40, supplier: suppliers[0]._id, description: 'Marine grade plywood' },
    { name: 'Galvanized Wire Mesh 50x50mm', sku: 'WMH-050', category: 'Construction', unit: 'rolls', minimumStock: 15, supplier: suppliers[0]._id, description: '1m x 25m roll galvanized mesh' },
    { name: 'Fire Extinguisher 6kg ABC', sku: 'SAF-F06', category: 'Safety', unit: 'pieces', minimumStock: 5, supplier: suppliers[3]._id, description: 'Dry powder ABC fire extinguisher' },
    { name: 'Generator Spare Parts Kit', sku: 'GEN-SPK', category: 'Spare Parts', unit: 'kits', minimumStock: 3, supplier: suppliers[2]._id, description: 'Standard maintenance kit' },
    { name: 'Paint White Exterior 20L', sku: 'PNT-W20', category: 'Finishing', unit: 'tins', minimumStock: 20, supplier: suppliers[2]._id, description: 'Weatherproof exterior paint' },
    { name: 'Ceramic Floor Tile 60x60cm', sku: 'TIL-F60', category: 'Finishing', unit: 'boxes', minimumStock: 30, supplier: suppliers[0]._id, description: '1 box = 4 tiles = 1.44m²' },
    { name: 'Solar Panel 300W Monocrystalline', sku: 'SOL-300', category: 'Electrical', unit: 'pieces', minimumStock: 10, supplier: suppliers[1]._id, description: '300W 24V monocrystalline panel' },
  ]);
  console.log('✅ Products created');

  // Add initial stock and receipts
  const now = new Date();
  const stockData = [
    { product: products[0], location: locations[4], qty: 150, supplierIdx: 0 },
    { product: products[1], location: locations[0], qty: 220, supplierIdx: 0 },
    { product: products[2], location: locations[6], qty: 85, supplierIdx: 2 },
    { product: products[3], location: locations[1], qty: 450, supplierIdx: 1 },
    { product: products[4], location: locations[7], qty: 35, supplierIdx: 3 },
    { product: products[5], location: locations[7], qty: 42, supplierIdx: 3 },
    { product: products[6], location: locations[2], qty: 25, supplierIdx: 1 },
    { product: products[7], location: locations[2], qty: 18, supplierIdx: 1 },
    { product: products[8], location: locations[5], qty: 60, supplierIdx: 0 },
    { product: products[9], location: locations[5], qty: 20, supplierIdx: 0 },
    { product: products[10], location: locations[8], qty: 12, supplierIdx: 3 },
    { product: products[11], location: locations[3], qty: 8, supplierIdx: 2 },
    { product: products[12], location: locations[9], qty: 30, supplierIdx: 2 },
    { product: products[13], location: locations[10], qty: 55, supplierIdx: 0 },
    { product: products[14], location: locations[11], qty: 7, supplierIdx: 1 },
  ];

  for (let i = 0; i < stockData.length; i++) {
    const { product, location, qty, supplierIdx } = stockData[i];
    const daysAgo = Math.floor(Math.random() * 25) + 1;
    const receiptDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    const receipt = await GoodsReceipt.create({
      product: product._id,
      supplier: suppliers[supplierIdx]._id,
      location: location._id,
      quantity: qty,
      referenceNote: `Initial stock - REF-${String(i + 1).padStart(4, '0')}`,
      receiptDate,
      receivedBy: storekeeper._id,
    });

    await Stock.findOneAndUpdate(
      { product: product._id, location: location._id },
      { $inc: { quantity: qty } },
      { upsert: true }
    );

    await StockMovement.create({
      product: product._id, location: location._id, type: 'receipt',
      quantity: qty, balanceBefore: 0, balanceAfter: qty,
      reference: receipt._id, referenceModel: 'GoodsReceipt',
      performedBy: storekeeper._id,
    });
  }
  console.log('✅ Initial stock and receipts created');

  // Sample dispatch orders
  const dispatches = await DispatchOrder.create([
    { product: products[0]._id, client: clients[0]._id, quantity: 30, status: 'pending', requestedBy: storekeeper._id, notes: 'Urgent - site construction Phase 1' },
    { product: products[1]._id, client: clients[2]._id, quantity: 50, status: 'approved', requestedBy: storekeeper._id, approvedBy: manager._id, approvedAt: new Date(), notes: 'Foundation works' },
    { product: products[3]._id, client: clients[1]._id, quantity: 100, status: 'dispatched', requestedBy: storekeeper._id, approvedBy: manager._id, approvedAt: new Date(now - 2 * 24 * 60 * 60 * 1000), dispatchedAt: new Date(now - 24 * 60 * 60 * 1000), notes: 'Grid extension project' },
    { product: products[4]._id, client: clients[3]._id, quantity: 10, status: 'rejected', requestedBy: storekeeper._id, rejectionReason: 'Insufficient budget allocation for this period', notes: '' },
    { product: products[8]._id, client: clients[0]._id, quantity: 20, status: 'pending', requestedBy: storekeeper._id, notes: 'Formwork for columns' },
  ]);

  // Deduct stock for dispatched order
  const dispatchedOrder = dispatches[2];
  await Stock.findOneAndUpdate(
    { product: products[3]._id, location: locations[1]._id },
    { $inc: { quantity: -100 } }
  );
  await StockMovement.create({
    product: products[3]._id, location: locations[1]._id, type: 'dispatch',
    quantity: -100, balanceBefore: 450, balanceAfter: 350,
    reference: dispatchedOrder._id, referenceModel: 'DispatchOrder',
    performedBy: manager._id,
  });
  console.log('✅ Sample dispatch orders created');

  // Activity logs
  await ActivityLog.create([
    { user: admin._id, userEmail: admin.email, action: 'login', details: 'Initial login', ipAddress: '127.0.0.1' },
    { user: manager._id, userEmail: manager.email, action: 'login', details: 'Initial login', ipAddress: '127.0.0.1' },
    { user: storekeeper._id, userEmail: storekeeper.email, action: 'login', details: 'Initial login', ipAddress: '127.0.0.1' },
    { user: storekeeper._id, userEmail: storekeeper.email, action: 'create', resource: 'GoodsReceipt', details: 'Recorded initial stock', ipAddress: '127.0.0.1' },
    { user: manager._id, userEmail: manager.email, action: 'approve', resource: 'DispatchOrder', resourceId: dispatches[1]._id, details: 'Approved dispatch for foundation works', ipAddress: '127.0.0.1' },
  ]);
  console.log('✅ Activity logs created');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log('Demo accounts created. Use the passwords configured in .env.');
  console.log('='.repeat(60) + '\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
