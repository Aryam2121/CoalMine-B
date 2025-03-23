import express from 'express';
import { getAllResources, createResource, updateResource, deleteResource } from '../controllers/resourceController.js';

const router = express.Router();

router.get('/getAllRes', getAllResources);
router.post('/addRes', createResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

export default router;
