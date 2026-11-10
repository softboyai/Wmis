import express from 'express';
import { getStockReport, getReceiptsReport, getDispatchesReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('administrator', 'manager'));

router.get('/stock', getStockReport);
router.get('/receipts', getReceiptsReport);
router.get('/dispatches', getDispatchesReport);

export default router;
