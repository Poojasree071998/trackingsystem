const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Seed initial users for testing (Run once)
router.post('/seed', async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Users already seeded' });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = (pwd) => bcrypt.hash(pwd, salt);

    await User.create([
      { name: 'Admin User', email: 'admin@trackpro.com', password: await hashPassword('password123'), role: 'admin' },
      { name: 'HR Manager', email: 'hr@trackpro.com', password: await hashPassword('password123'), role: 'hr' },
      { name: 'John Doe', email: 'employee@trackpro.com', password: await hashPassword('password123'), role: 'employee', employeeId: 'EMP001' }
    ]);
    res.status(201).json({ message: 'Initial users created. Passwords are "password123"' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
