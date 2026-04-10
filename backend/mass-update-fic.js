const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const migrate = async () => {
  try {
    const uri = (process.env.MONGO_URI || '').trim();
    if (!uri) {
        console.error('❌ MONGO_URI is not defined in .env');
        process.exit(1);
    }

    console.log('📡 Connecting to MongoDB for mass credential update...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    const users = await User.find({});
    console.log(`🔍 Found ${users.length} users. Processing...`);

    for (let user of users) {
      const nameParts = user.name.split(' ');
      const firstName = (nameParts[0] || 'user').toLowerCase().replace(/[^a-z]/g, '');
      
      let newEmail = '';
      let newPasswordRaw = '';
      
      if (user.role === 'admin') {
        newEmail = 'admin@fic.com';
        newPasswordRaw = 'admin123';
      } else if (user.role === 'hr') {
        newEmail = 'hr@fic.com';
        newPasswordRaw = 'hr123';
      } else {
        newEmail = `${firstName}@fic.com`;
        newPasswordRaw = `${firstName}123`;
      }

      console.log(`🔄 Updating [${user.role}] ${user.name}:`);
      console.log(`   - New Email: ${newEmail}`);
      console.log(`   - New Password: ${newPasswordRaw}`);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPasswordRaw, salt);

      user.email = newEmail;
      user.password = hashedPassword;
      
      // Handle potential duplicate emails by appending ID if necessary, 
      // though firstNamefic@fic.com is the goal.
      try {
        await user.save();
      } catch (saveErr) {
        if (saveErr.code === 11000) {
            console.warn(`   ⚠️  Email ${newEmail} already exists. Using alternative.`);
            user.email = `${firstName}${user._id.toString().substring(18,24)}fic@fic.com`;
            await user.save();
        } else {
            throw saveErr;
        }
      }
    }

    console.log(`✅ Mass update complete!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
 Sands
