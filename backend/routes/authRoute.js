const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Seed initial users (GET for easy browser setup)
router.get('/seed-get', async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Users already seeded' });

    const hashPassword = async (pwd) => {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(pwd, salt);
    };

    await User.create([
      { name: 'Admin User', email: 'admin@fic.com', password: await hashPassword('password123'), role: 'admin' },
      { name: 'HR Manager', email: 'hr@fic.com', password: await hashPassword('password123'), role: 'hr' },
      { name: 'John Doe', email: 'john@fic.com', password: await hashPassword('password123'), role: 'employee', employeeId: 'EMP001' }
    ]);
    res.status(201).json({ message: 'Initial users created! Login: admin@fic.com / hr@fic.com / john@fic.com with password: password123' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ FORCE-RESET: Always resets all 3 core users to password123 (works even if users exist)
// Call from browser: GET /api/auth/force-reset
router.get('/force-reset', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('password123', salt);

    const coreUsers = [
      { name: 'Admin User',  email: 'admin@fic.com', role: 'admin' },
      { name: 'HR Manager',  email: 'hr@fic.com',    role: 'hr'    },
      { name: 'John Doe',    email: 'john@fic.com',  role: 'employee', employeeId: 'EMP001' }
    ];

    const results = [];
    for (const u of coreUsers) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        await User.updateOne({ email: u.email }, { $set: { password: hashed } });
        results.push(`✅ Reset: ${u.email}`);
      } else {
        await User.create({ ...u, password: hashed });
        results.push(`🆕 Created: ${u.email}`);
      }
    }

    res.json({
      success: true,
      message: 'All core users reset to password123',
      credentials: [
        { email: 'admin@fic.com', password: 'password123', role: 'admin' },
        { email: 'hr@fic.com',    password: 'password123', role: 'hr' },
        { email: 'john@fic.com',  password: 'password123', role: 'employee' }
      ],
      details: results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const mongoose = require('mongoose');

    // If the DB is still in the process of connecting (e.g. Render cold start),
    // wait up to 10 seconds for it to become ready before failing.
    if (mongoose.connection.readyState !== 1) {
      let waited = 0;
      while (mongoose.connection.readyState === 2 && waited < 10000) {
        await new Promise(resolve => setTimeout(resolve, 500));
        waited += 500;
      }
      // After waiting, if still not connected, return a proper error
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          message: 'The server is starting up. Please wait a moment and try again.',
          retryAfter: 5
        });
      }
    }

    const { email, password } = req.body;

    // Validate input fields are present
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Normalize email: trim whitespace and convert to lowercase to prevent case/space mismatches
    const normalizedEmail = email.trim().toLowerCase();

    console.log(`🔐 Login attempt for: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`❌ Login failed - user not found: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Login failed - wrong password for: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    console.log(`✅ Login successful for: ${normalizedEmail} (${user.role})`);

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
    console.error('❌ Login route error:', err.message);
    res.status(500).json({ message: 'An internal server error occurred. Please try again.' });
  }
});

module.exports = router;
