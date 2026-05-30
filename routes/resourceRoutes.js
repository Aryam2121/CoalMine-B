import express from 'express';
import { getAllResources, createResource, updateResource, deleteResource } from '../controllers/resourceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/getAllRes', protect, getAllResources);
router.post('/addRes', protect, createResource);
router.put('/updateRes/:id', protect, updateResource);
router.delete('/deleteRes/:id', protect, deleteResource);

export default router;
