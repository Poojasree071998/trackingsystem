const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanagementsystem';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    const users = await User.find();
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      process.exit();
    }

    // Clear existing attendance
    await Attendance.deleteMany({});

    const statuses = ['Present', 'Present', 'Present', 'Absent', 'Leave']; // Weighted towards Present
    const now = new Date();
    
    let records = [];

    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      users.forEach(user => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        records.push({
          userId: user._id,
          name: user.name,
          role: user.role,
          status: status,
          date: dateString,
          checkInTime: status === 'Present' ? '09:00 AM' : null,
          checkOutTime: status === 'Present' ? '06:00 PM' : null
        });
      });
    }

    await Attendance.insertMany(records);
    console.log(`Successfully seeded ${records.length} attendance records.`);
    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
