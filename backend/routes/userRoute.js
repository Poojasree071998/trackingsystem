const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { role } = req.query; // e.g. hr, employee
    let query = {};
    if (role) query.role = role;
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, designation, department } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      designation,
      department,
      employeeId: `EMP-${Date.now().toString().slice(-6)}` // Simple unique ID
    });

    await newUser.save();

    // Broadcast dataUpdated event for Admin and HR to refresh their lists
    const io = req.app.get('io');
    if (io) {
      io.emit('dataUpdated', { type: 'User' });
    }

    res.status(201).json({ message: 'Employee added successfully', user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

