const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// GET all attendance (Admin & HR)
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({ createdAt: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET personal attendance (Employee)
router.get('/me/:userId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mark attendance (testing/real-usage)
router.post('/mark', async (req, res) => {
  try {
    const { userId, name, role, status, date } = req.body;
    
    // Check if attendance already marked for the day
    let existing = await Attendance.findOne({ userId, date });
    if (existing) {
      existing.status = status;
      await existing.save();
      return res.json(existing);
    }

    const newRecord = new Attendance({
      userId, name, role, status, date
    });
    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
