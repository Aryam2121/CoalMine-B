import express from 'express';
import { getResources, createResource, updateResource, deleteResource } from '../controllers/resourceController.js';

const router = express.Router();

router.get('/getAllRes', getResources);
router.post('/addRes', createResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

export default router;
