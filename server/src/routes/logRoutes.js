import express from 'express';
import { getLogs } from '../controllers/logController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('administrator'));
router.get('/', getLogs);

export default router;
