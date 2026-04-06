const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// GET all leave requests (Admin/HR)
router.get('/', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET personal leave history (Employee)
router.get('/me/:userId', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST apply for leave (Employee)
router.post('/apply', async (req, res) => {
  try {
    const { userId, name, startDate, endDate, reason, leaveType } = req.body;
    const newLeave = new LeaveRequest({
      userId, name, startDate, endDate, reason, leaveType
    });
    await newLeave.save();
    res.status(201).json(newLeave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update leave status (HR/Admin Approval)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, approvedBy } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);
    
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    leave.status = status;
    leave.approvedBy = approvedBy;
    await leave.save();

    // If approved, update attendance and user status
    if (status === 'Approved') {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      
      // Update User Status
      await User.findByIdAndUpdate(leave.userId, { status: 'On Leave' });

      // Generate Attendance records for leave dates
      let current = new Date(start);
      while (current <= end) {
        const dateString = current.toISOString().split('T')[0];
        
        // Upsert attendance for each day
        await Attendance.findOneAndUpdate(
          { userId: leave.userId, date: dateString },
          { 
            userId: leave.userId, 
            name: leave.name, 
            status: 'Leave', 
            role: 'employee', // Fallback, usually fetched from user context
            date: dateString,
            leaveType: leave.leaveType 
          },
          { upsert: true, new: true }
        );
        current.setDate(current.getDate() + 1);
      }
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
