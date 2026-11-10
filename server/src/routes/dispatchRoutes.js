import express from 'express';
import {
  getDispatches, getDispatch, createDispatch,
  approveDispatch, rejectDispatch, dispatchOrder,
} from '../controllers/dispatchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getDispatches);
router.get('/:id', getDispatch);
router.post('/', authorize('administrator', 'storekeeper'), createDispatch);
router.post('/:id/approve', authorize('administrator', 'manager'), approveDispatch);
router.post('/:id/reject', authorize('administrator', 'manager'), rejectDispatch);
router.post('/:id/dispatch', authorize('administrator', 'manager'), dispatchOrder);

export default router;
