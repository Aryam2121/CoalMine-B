// routes/shiftLogs.js
import express from 'express';
import ShiftLog from '../models/shiftLogModel.js';
const router = express.Router();

router.post('/createLogs', async (req, res) => {
  try {
    const newLog = new ShiftLog(req.body);
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get('/getallLogs', async (req, res) => {
  try {
    const logs = await ShiftLog.find();
    res.status(200).json(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get('/getLog/:id', async (req, res) => {
  try {
    const log = await ShiftLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.status(200).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.delete('/deleteLog/:id', async (req, res) => {
  try {
    const log = await ShiftLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    await log.remove();
    res.json({ message: 'Log deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.put('/updateLog/:id', async (req, res) => {
  try {
    const { shiftDetails, shiftDate, shiftStartTime, shiftEndTime, workerId, status, notes } = req.body;
    const log = await ShiftLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    log.shiftDetails = shiftDetails;
    log.shiftDate = shiftDate;
    log.shiftStartTime = shiftStartTime;
    log.shiftEndTime = shiftEndTime;
    log.workerId = workerId;
    log.status = status;
    log.notes = notes;
    await log.save();
    res.json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
export default router;
