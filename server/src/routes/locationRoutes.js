import express from 'express';
import { getLocations, getLocation, createLocation, updateLocation, deleteLocation } from '../controllers/locationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getLocations);
router.get('/:id', getLocation);
router.post('/', authorize('administrator'), createLocation);
router.put('/:id', authorize('administrator'), updateLocation);
router.delete('/:id', authorize('administrator'), deleteLocation);

export default router;
