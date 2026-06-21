import express from 'express';
import { getAllResources, createResource, updateResource, deleteResource } from '../controllers/resourceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.get('/getAllRes', protect, getAllResources);
router.post('/addRes', protect, requirePermission(PERMISSIONS.RESOURCE_MANAGE), createResource);
router.put('/updateRes/:id', protect, requirePermission(PERMISSIONS.RESOURCE_MANAGE), updateResource);
router.delete('/deleteRes/:id', protect, requirePermission(PERMISSIONS.RESOURCE_MANAGE), deleteResource);

export default router;
