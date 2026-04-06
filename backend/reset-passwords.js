const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    await User.updateMany(
      { email: { $in: ['admin@trackpro.com', 'hr@trackpro.com', 'employee@trackpro.com'] } },
      { $set: { password: hashedPassword } }
    );
    
    console.log("All predefined users passwords forcefully reset to 'password123'");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
reset();
