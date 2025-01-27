// routes/safetyPlans.js
import express from 'express';
import SafetyPlan from '../models/safetyPlanModel.js';
const router = express.Router();

router.post('/createPlan', async (req, res) => {
  try {
    const newPlan = new SafetyPlan(req.body);
    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get('/getallPlans', async (req, res) => {
  try {
    const plans = await SafetyPlan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get('/getPlan/:id', async (req, res) => {
  try {
    const plan = await SafetyPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.status(200).json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.delete('/deletePlan/:id', async (req, res) => {
  try {
    const plan = await SafetyPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    await plan.remove();
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.put('/updatePlan/:id', async (req, res) => {
  try {
    const { planName, planDescription, planCategory, planSteps } = req.body;
    const plan = await SafetyPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    plan.planName = planName;
    plan.planDescription = planDescription;
    plan.planCategory = planCategory;
    plan.planSteps = planSteps;
    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
