const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const migrate = async () => {
  try {
    const uri = (process.env.MONGO_URI || '').trim();
    if (!uri) {
        console.error('❌ MONGO_URI is not defined in .env');
        process.exit(1);
    }

    console.log('📡 Connecting to MongoDB for migration...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    const result = await User.updateMany(
      { email: { $regex: /@trackpro\.com$/ } },
      [
        {
          $set: {
            email: {
              $replaceOne: { input: "$email", find: "@trackpro.com", replacement: "@techpro.com" }
            }
          }
        }
      ]
    );

    console.log(`✅ Migration complete!`);
    console.log(`📝 Modified ${result.modifiedCount} users.`);
    
    // Also specifically handle the core users just in case regex didn't catch something
    console.log('🏁 Ensuring core users are mapped correctly...');
    await User.updateOne({ email: 'admin@trackpro.com' }, { $set: { email: 'admin@techpro.com' } });
    await User.updateOne({ email: 'hr@trackpro.com' }, { $set: { email: 'hr@techpro.com' } });
    await User.updateOne({ email: 'employee@trackpro.com' }, { $set: { email: 'employee@techpro.com' } });

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
