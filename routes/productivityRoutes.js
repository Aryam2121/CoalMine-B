import express from 'express';
import ProductivityController from '../controllers/productivityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

const Prodrouter = express.Router();

// Fetch, Create, Update, and Delete Routes
Prodrouter.get('/getData', protect, ProductivityController.getProductivityData);
Prodrouter.post(
  '/createData',
  protect,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  ProductivityController.addProductivityRecord
);
Prodrouter.put(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  ProductivityController.updateProductivityRecord
);
Prodrouter.delete(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  ProductivityController.deleteProductivityRecord
);

export default Prodrouter;
