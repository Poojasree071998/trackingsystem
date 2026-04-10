const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);
const User = require('./models/User');

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    await User.updateMany(
      { email: { $in: ['admin@techpro.com', 'hr@techpro.com', 'employee@techpro.com'] } },
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
