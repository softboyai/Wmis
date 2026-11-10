import express from 'express';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', authorize('administrator'), createSupplier);
router.put('/:id', authorize('administrator'), updateSupplier);
router.delete('/:id', authorize('administrator'), deleteSupplier);

export default router;
