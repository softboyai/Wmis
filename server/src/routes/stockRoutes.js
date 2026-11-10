import express from 'express';
import { getStock, getStockByLocation, getMovements } from '../controllers/stockController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getStock);
router.get('/by-location', getStockByLocation);

export default router;
