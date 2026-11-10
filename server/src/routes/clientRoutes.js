import express from 'express';
import { getClients, getClient, createClient, updateClient, deleteClient } from '../controllers/clientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', authorize('administrator'), createClient);
router.put('/:id', authorize('administrator'), updateClient);
router.delete('/:id', authorize('administrator'), deleteClient);

export default router;
