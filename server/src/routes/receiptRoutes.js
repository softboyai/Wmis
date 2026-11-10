import express from 'express';
import { getReceipts, createReceipt, getReceipt } from '../controllers/receiptController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getReceipts);
router.get('/:id', getReceipt);
router.post('/', authorize('administrator', 'storekeeper'), createReceipt);

export default router;
