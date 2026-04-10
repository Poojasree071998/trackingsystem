const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, { email: 1, role: 1, _id: 0 });
    console.log('Users in database:');
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    console.log(`Total: ${users.length} users`);
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
};
check();
