import express from 'express';
import { 
  getAllSafetyPlans, 
  getSafetyPlanById, 
  createSafetyPlan, 
  updateSafetyPlan, 
  deleteSafetyPlan ,upload
} from '../controllers/safetyplanController.js'; // Adjust the path if needed

const router = express.Router();

// Routes for safety plans
router.get('/getAllsafe', getAllSafetyPlans);
router.get('/getsafe/:id', getSafetyPlanById);
router.post("/addsafe", upload.single("file"), createSafetyPlan);
router.put('/updatesafe/:id',upload.single("file"), updateSafetyPlan);
router.delete('/deletesafe/:id', deleteSafetyPlan);

export default router;
