const express = require('express');
const LOP = require('../models/LOP');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// Helper: Send real-time notification
const sendRealTimeNotification = async (req, notification) => {
  try {
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const socketId = userSockets.get(notification.recipient.toString());
    if (io) io.emit('dataUpdated', { type: 'LOP' });
    if (socketId) {
      const populated = await Notification.findById(notification._id).populate('sender', 'name');
      io.to(socketId).emit('newNotification', populated);
    }
  } catch (err) {
    console.error('Socket error:', err);
  }
};

// GET all LOP records (Admin / HR)
router.get('/', async (req, res) => {
  try {
    const records = await LOP.find()
      .populate('employeeId', 'name email department')
      .populate('taskId', 'taskTitle deadline status')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET LOP records for a specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const records = await LOP.find({ employeeId: req.params.employeeId })
      .populate('taskId', 'taskTitle deadline status')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET overdue tasks (tasks past deadline and NOT completed)
router.get('/overdue-tasks', async (req, res) => {
  try {
    const now = new Date();
    const overdueTasks = await Task.find({
      deadline: { $lt: now },
      status: { $nin: ['Completed'] }
    })
      .populate('assignedToEmployee', 'name email department')
      .populate('assignedByHR', 'name')
      .populate('project', 'projectName projectKey')
      .sort({ deadline: 1 });

    // For each task, check if an LOP record already exists
    const tasksWithLOPStatus = await Promise.all(overdueTasks.map(async (task) => {
      const lopRecord = await LOP.findOne({ taskId: task._id });
      return {
        ...task.toObject(),
        lopRecord: lopRecord || null
      };
    }));

    res.json(tasksWithLOPStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Send Warning Notification (1st or Final)
router.post('/warning', async (req, res) => {
  try {
    const { taskId, senderId, warningType } = req.body; // warningType: 'first' | 'final'

    const task = await Task.findById(taskId).populate('assignedToEmployee', 'name');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isFirst = warningType === 'first';
    const warningLevel = isFirst ? 1 : 2;
    const message = isFirst
      ? `⚠️ Warning: You missed the deadline for task "${task.taskTitle}". Please update your task status immediately.`
      : `🚨 Final Warning: This is your final reminder. Failure to complete or update task "${task.taskTitle}" will result in Loss of Pay (LOP) as per company policy.`;

    // Upsert an LOP tracking record for this task
    await LOP.findOneAndUpdate(
      { taskId: task._id, lopStatus: { $ne: 'Applied' } },
      {
        employeeId: task.assignedToEmployee._id,
        taskId: task._id,
        delayDays: Math.max(1, Math.ceil((new Date() - new Date(task.deadline)) / (1000 * 60 * 60 * 24))),
        lopStatus: 'Pending',
        warningsSent: warningLevel
      },
      { upsert: true, new: true }
    );

    const notification = await Notification.create({
      recipient: task.assignedToEmployee._id,
      sender: senderId,
      message,
      type: 'lop_warning',
      relatedTask: task._id
    });

    sendRealTimeNotification(req, notification);

    res.json({ success: true, message: `${isFirst ? 'First' : 'Final'} warning sent to ${task.assignedToEmployee.name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Apply LOP
router.post('/apply', async (req, res) => {
  try {
    const { taskId, senderId, reason } = req.body;

    const task = await Task.findById(taskId).populate('assignedToEmployee', 'name email');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check if LOP already applied
    const existingLOP = await LOP.findOne({ taskId, lopStatus: 'Applied' });
    if (existingLOP) return res.status(400).json({ error: 'LOP already applied for this task.' });

    // Calculate delay days
    const now = new Date();
    const deadline = new Date(task.deadline);
    const delayDays = Math.max(1, Math.ceil((now - deadline) / (1000 * 60 * 60 * 24)));

    // Create LOP Record
    const lop = await LOP.create({
      employeeId: task.assignedToEmployee._id,
      taskId: task._id,
      delayDays,
      reason: reason || 'Task not completed within deadline. No proper update provided.',
      lopStatus: 'Applied'
    });

    // Mark task as Overdue
    await Task.findByIdAndUpdate(taskId, { status: 'Overdue' });

    // Send LOP Notification to Employee
    const notification = await Notification.create({
      recipient: task.assignedToEmployee._id,
      sender: senderId,
      message: `🔴 LOP Applied: Due to incomplete task "${task.taskTitle}" and lack of update, Loss of Pay (LOP) has been applied as per company policy.`,
      type: 'lop_applied',
      relatedTask: task._id
    });

    sendRealTimeNotification(req, notification);

    const populated = await LOP.findById(lop._id)
      .populate('employeeId', 'name email department')
      .populate('taskId', 'taskTitle deadline status');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Waive an LOP record
router.put('/:id/waive', async (req, res) => {
  try {
    const { senderId } = req.body;
    const lop = await LOP.findByIdAndUpdate(
      req.params.id,
      { lopStatus: 'Waived' },
      { new: true }
    ).populate('employeeId', 'name').populate('taskId', 'taskTitle');

    if (!lop) return res.status(404).json({ error: 'LOP record not found' });

    // Notify employee the LOP was waived
    const notification = await Notification.create({
      recipient: lop.employeeId._id,
      sender: senderId,
      message: `✅ Good news! The LOP for task "${lop.taskId.taskTitle}" has been waived by management.`,
      type: 'lop_waived',
      relatedTask: lop.taskId._id
    });

    sendRealTimeNotification(req, notification);

    res.json(lop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
