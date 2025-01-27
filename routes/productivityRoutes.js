import express from 'express';
import ProductivityController from '../controllers/productivityController.js';

const Prodrouter = express.Router();

// Fetch, Create, Update, and Delete Routes
Prodrouter.get('/getData', ProductivityController.getProductivityData); // Fetch data with filtering, pagination, sorting
Prodrouter.post('/createData', ProductivityController.addProductivityRecord); // Add a record
Prodrouter.put('/:id', ProductivityController.updateProductivityRecord); // Update a record
Prodrouter.delete('/:id', ProductivityController.deleteProductivityRecord); // Delete a record

export default Prodrouter;
