const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'admin@fic.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
    } else {
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log(`User: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password match for 'password123': ${isMatch}`);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
test();
