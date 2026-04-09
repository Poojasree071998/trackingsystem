const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
const net = require('net');

dotenv.config({ path: './.env' });

async function runCheck() {
  console.log('🔍 Starting FIC System Diagnostic...');
  console.log('------------------------------------');

  // 1. Check Port 5001
  const checkPort = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve(false);
      });
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };

  const isPortAvailable = await checkPort(5001);
  if (isPortAvailable) {
    console.log('✅ Port 5001 is AVAILABLE.');
  } else {
    console.log('❌ Port 5001 is IN USE. Please close other instances before running backend.');
  }

  // 2. Check DNS
  dns.resolve('google.com', (err) => {
    if (err) {
      console.log('❌ DNS Resolution FAILED. Check your internet connection.');
    } else {
      console.log('✅ DNS Resolution is WORKING.');
    }
  });

  // 3. Check MongoDB
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('❌ MONGO_URI missing in backend/.env');
  } else {
    console.log('📡 Attempting MongoDB Connection...');
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ MongoDB Connection SUCCESSFUL.');
      console.log(`📂 Database: ${mongoose.connection.name}`);
      await mongoose.disconnect();
    } catch (err) {
      console.log('❌ MongoDB Connection FAILED.');
      console.log(`📝 Error: ${err.message}`);
    }
  }

  console.log('------------------------------------');
  console.log('💡 TIP: If all GREEN, run: npm run dev');
}

runCheck().catch(err => console.error(err));
