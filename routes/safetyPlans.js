import express from 'express';
import { 
  getAllSafetyPlans, 
  getSafetyPlanById, 
  createSafetyPlan, 
  updateSafetyPlan, 
  deleteSafetyPlan 
} from '../controllers/safetyplanController.js'; // Adjust the path if needed

const router = express.Router();

// Routes for safety plans
router.get('/getAllsafe', getAllSafetyPlans);
router.get('/getsafe/:id', getSafetyPlanById);
router.post('/addsafe', createSafetyPlan);
router.put('/updatesafe/:id', updateSafetyPlan);
router.delete('/deletesafe/:id', deleteSafetyPlan);

export default router;
