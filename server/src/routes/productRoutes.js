import express from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories } from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authorize('administrator'), createProduct);
router.put('/:id', authorize('administrator'), updateProduct);
router.delete('/:id', authorize('administrator'), deleteProduct);

export default router;
