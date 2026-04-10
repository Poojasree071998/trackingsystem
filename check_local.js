const http = require('http');

console.log('🔍 FIC Local Diagnostic Tool');
console.log('-----------------------------');

const checkBackend = () => {
  return new Promise((resolve) => {
    console.log('📡 Checking Backend on http://localhost:5001/api/health...');
    const req = http.get('http://localhost:5001/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Backend: ONLINE');
          console.log(`✅ Database: ${json.dbReady ? 'CONNECTED' : 'DISCONNECTED'}`);
          resolve(true);
        } catch (e) {
          console.log('❌ Backend: INVALID RESPONSE (Parse Error)');
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Backend: UNREACHABLE (${err.message})`);
      console.log('💡 TIP: Run "npm start" in the backend directory.');
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ Backend: TIMEOUT');
      resolve(false);
    });
  });
};

checkBackend().then(success => {
  console.log('-----------------------------');
  if (success) {
    console.log('🚀 SYSTEM READY: You can now run "npm run dev" in the frontend.');
  } else {
    console.log('⚠️  SYSTEM NOT READY: Fix backend issues before starting frontend.');
  }
});
