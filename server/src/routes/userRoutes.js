import express from 'express';
import { getUsers, createUser, updateUser, resetUserPassword, getUserById } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('administrator'));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;
