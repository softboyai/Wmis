import express from 'express';
import { getMovements } from '../controllers/stockController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getMovements);

export default router;
