const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

// Get notifications for a user
router.get('/', async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    let query = { 
      $or: [
        { recipient: userId },
        { sender: userId, type: { $ne: 'System' } }
      ]
    };

    // Admin can see everything for oversight
    if (role === 'admin') {
      query = {}; 
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('sender', 'name')
      .populate('recipient', 'name');
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id, 
      { status: 'Read' }, 
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.put('/read-all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany(
      { recipient: userId, status: 'Unread' },
      { status: 'Read' }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to send real-time notification
const sendRealTimeNotification = async (req, notification) => {
  try {
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    if(io && userSockets) {
      const socketId = userSockets.get(notification.recipient.toString());
      if (socketId) {
        const populated = await Notification.findById(notification._id).populate('sender', 'name');
        io.to(socketId).emit('newNotification', populated);
      }
    }
  } catch (err) {
    console.error("Socket error:", err);
  }
};

// Send custom notification
router.post('/custom', async (req, res) => {
  try {
    const { sender, recipient, message } = req.body;
    
    if (!recipient || !message) {
      return res.status(400).json({ error: "Recipient and message are required" });
    }

    if (recipient === 'all') {
      const User = require('../models/User');
      const allUsers = await User.find();
      const notifications = [];
      
      for (const u of allUsers) {
        const notif = await Notification.create({
          recipient: u._id,
          sender,
          message,
          type: 'alert'
        });
        sendRealTimeNotification(req, notif);
        notifications.push(notif);
      }
      return res.status(201).json({ message: "Broadcast sent", count: notifications.length });
    } else {
      const notification = await Notification.create({
        recipient,
        sender,
        message,
        type: 'alert'
      });

      sendRealTimeNotification(req, notification);

      res.status(201).json(notification);
    }
  } catch (err) {
    console.error("CRITICAL Notification API Error:", err.message);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.keys(err.errors).map(key => `${key}: ${err.errors[key].message}`).join(', ');
      return res.status(400).json({ error: `Validation Error: ${validationErrors}`, details: err.errors });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
