const express = require('express');
const Task = require('../models/Task');
const LOP = require('../models/LOP');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');

const router = express.Router();

// Helper function to send real-time notification
const sendRealTimeNotification = async (req, notification) => {
  try {
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const socketId = userSockets.get(notification.recipient.toString());
    
    // Always broadcast dataUpdated globally for UI refreshes
    if (io) {
      io.emit('dataUpdated', { type: 'Task', id: notification.relatedTask });
    }

    if (socketId) {
      const populated = await Notification.findById(notification._id).populate('sender', 'name');
      io.to(socketId).emit('newNotification', populated);
    }
  } catch (err) {
    console.error("Socket error:", err);
  }
};

// Get tasks
router.get('/', async (req, res) => {
  try {
    const { role, userId } = req.query; // Send from frontend after decrypting JWT
    
    // Debug logging for production visibility
    console.log(`🔍 Fetching tasks: Role=${role}, UserId=${userId}`);

    // Admins don't strictly need a userId to view ALL tasks, 
    // but for other roles it's required for filtering.
    if (role !== 'admin' && (!userId || !mongoose.Types.ObjectId.isValid(userId))) {
      return res.status(400).json({ error: 'Valid userId is required for this role' });
    }

    const userObjectId = userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;

    let tasks;
    if (role === 'admin') {
      tasks = await Task.find()
        .populate('assignedByHR', 'name email')
        .populate('assignedToEmployee', 'name email')
        .populate('project', 'projectName projectKey');
    } else if (role === 'hr') {
      // Find tasks where HR is either the manager OR the assigned worker
      tasks = await Task.find({ 
        $or: [
          { assignedByHR: userObjectId }, 
          { assignedToEmployee: userObjectId }
        ] 
      })
      .populate('assignedByHR', 'name email')
      .populate('assignedToEmployee', 'name email')
      .populate('project', 'projectName projectKey');
    } else {
      // Employee view
      tasks = await Task.find({ assignedToEmployee: userObjectId })
        .populate('assignedByHR', 'name email')
        .populate('assignedToEmployee', 'name email')
        .populate('project', 'projectName projectKey');
    }
    console.log(`✅ Returned ${tasks.length} tasks for UserId=${userId || 'Admin'}`);
    res.json(tasks);
  } catch (err) {
    console.error(`❌ Task Fetch Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// HR assigns Task
router.post('/assign', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();

    // Create Notification for the Employee
    const notification = await Notification.create({
      recipient: task.assignedToEmployee,
      sender: task.assignedByHR,
      message: task.issueType === 'Interview' 
        ? `Interview: ${task.taskTitle} for ${task.taskDescription} on ${task.taskDate} at ${task.taskTime}` 
        : `New task assigned: "${task.taskTitle}"`,
      type: task.issueType === 'Interview' ? 'interview_assignment' : 'task_assignment',
      relatedTask: task._id
    });

    sendRealTimeNotification(req, notification);

    // If it's an Interview, also notify all Admins
    if (task.issueType === 'Interview') {
      const admins = await User.find({ role: 'admin' });
      const hrSender = await User.findById(task.assignedByHR);
      const interviewer = await User.findById(task.assignedToEmployee);

      for (const admin of admins) {
        if (admin._id.toString() !== task.assignedByHR.toString()) { // Don't notify the sender if they are an admin
          const adminNotif = await Notification.create({
            recipient: admin._id,
            sender: task.assignedByHR,
            message: `Hiring Update: ${hrSender?.name || 'HR'} scheduled interview for ${task.taskTitle} (${task.taskDescription}) on ${task.taskDate} at ${task.taskTime}.`,
            type: 'interview_assignment',
            relatedTask: task._id
          });
          sendRealTimeNotification(req, adminNotif);
        }
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedByHR', 'name')
      .populate('assignedToEmployee', 'name')
      .populate('project', 'projectName projectKey');

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Task status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    // Create Notification for the HR Manager
    const notification = await Notification.create({
      recipient: task.assignedByHR,
      sender: task.assignedToEmployee,
      message: `Task progress updated: "${task.taskTitle}" is now ${status}`,
      type: 'task_status_update',
      relatedTask: task._id
    });

    sendRealTimeNotification(req, notification);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Comment
router.post('/:id/comment', async (req, res) => {
  try {
    const { userId, text } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.comments.push({ user: userId, text });
    await task.save();

    // Determine recipient (Notify the other person in the assignment)
    const recipient = userId === task.assignedByHR.toString() 
      ? task.assignedToEmployee 
      : task.assignedByHR;

    const notification = await Notification.create({
      recipient: recipient,
      sender: userId,
      message: `New comment on task: "${task.taskTitle}"`,
      type: 'task_comment',
      relatedTask: task._id
    });

    sendRealTimeNotification(req, notification);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Stats for Dashboard
router.get('/stats', async (req, res) => {
  try {
    const { role, userId } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Valid userId is required for stats' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    let match = {};
    if (role === 'hr') match = { assignedByHR: userObjectId };
    if (role === 'employee') match = { assignedToEmployee: userObjectId }; 

    const total = await Task.countDocuments(match);
    const completed = await Task.countDocuments({ ...match, status: 'Completed' });
    const pending = await Task.countDocuments({ ...match, status: { $in: ['To Do', 'In Progress', 'Under Review'] } });
    const overdue = await Task.countDocuments({ ...match, status: 'Overdue' });

    const totalGlobalUsers = await User.countDocuments();
    const totalGlobalProjects = await Project.countDocuments();
    const totalGlobalTasks = await Task.countDocuments();

    const totalInterviews = await Task.countDocuments({ ...match, issueType: 'Interview' });
    const totalLopUsers = await LOP.countDocuments({ lopStatus: 'Applied' });

    res.json({ 
      total, 
      completed, 
      pending, 
      overdue,
      totalInterviews,
      totalLopUsers,
      totalGlobalUsers,
      totalGlobalProjects,
      totalGlobalTasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

