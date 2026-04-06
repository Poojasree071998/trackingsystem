const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// Get all projects with task stats
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('lead', 'name role')
      .populate('members', 'name role designation');
    
    const projectWithStats = await Promise.all(projects.map(async (proj) => {
      const tasks = await Task.find({ project: proj._id });
      const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length;
      return {
        ...proj.toObject(),
        taskCount: tasks.length,
        completedTasks,
        progress: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
      };
    }));

    res.json(projectWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single project with its tasks and members (for Board View)
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('lead', 'name role')
      .populate('members', 'name role designation department');

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedToEmployee', 'name')
      .populate('assignedByHR', 'name')
      .sort({ createdAt: -1 });

    res.json({ ...project.toObject(), tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  try {
    const { lead, ...otherData } = req.body;
    const projectData = { ...otherData };
    
    // Convert empty lead string to undefined to avoid CastError
    if (lead && lead !== '') {
      projectData.lead = lead;
    }

    const newProject = new Project(projectData);
    await newProject.save();

    // Notify Lead
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    // Notify Lead
    if (newProject.lead) {
      const notification = new Notification({
        recipient: newProject.lead,
        type: 'project_assignment',
        message: `You have been assigned as the lead for project: ${newProject.projectName} (${newProject.projectKey}).`,
        status: 'Unread'
      });
      await notification.save();

      const socketId = userSockets.get(newProject.lead.toString());
      if (socketId) {
        io.to(socketId).emit('newNotification', notification);
      }
    }

    // Broadcast dataUpdated for all
    if (io) {
      io.emit('dataUpdated', { type: 'Project', id: newProject._id });
    }

    res.status(201).json(newProject);
  } catch (err) {
    // Handle duplicate key error (E11000)
    if (err.code === 11000) {
      const key = req.body.projectKey || 'unknown';
      return res.status(400).json({ error: `Project key '${key}' already exists. Please choose a unique key.` });
    }
    // Handle validation and casting errors
    res.status(500).json({ error: err.message });
  }
});

// Update project details / status
router.put('/:id', async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('lead', 'name').populate('members', 'name role');

    // Broadcast dataUpdated for all
    const io = req.app.get('io');
    if (io) {
      io.emit('dataUpdated', { type: 'Project', id: updated._id });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or remove members from a project
router.put('/:id/members', async (req, res) => {
  try {
    const { action, userId } = req.body; // action: 'add' | 'remove'
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (action === 'add') {
      if (!project.members.includes(userId)) {
        project.members.push(userId);
        
        // Notify Member
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        const message = `You have been added to project: ${project.projectName} (${project.projectKey}).`;
        const notification = new Notification({
          recipient: userId,
          type: 'project_assignment',
          message,
          status: 'Unread'
        });
        await notification.save();

        const socketId = userSockets.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit('newNotification', notification);
        }
      }
    } else if (action === 'remove') {
      project.members = project.members.filter(m => m.toString() !== userId);
    }

    await project.save();

    // Broadcast dataUpdated for all
    const io = req.app.get('io');
    if (io) {
      io.emit('dataUpdated', { type: 'Project', id: project._id });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
