const { execSync } = require('child_process');

const ports = [5001, 5173, 5174, 5175, 5176, 5177, 5178];

console.log('🧹 FIC Nuclear Reset - Cleaning up ports...');

ports.forEach(port => {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.split('\n');
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid) && pid !== '0') {
        console.log(`🔫 Terminating process ${pid} on port ${port}...`);
        try { execSync(`taskkill /F /PID ${pid}`); } catch (e) {}
      }
    });
  } catch (e) {
    // Port not in use
  }
});

console.log('✨ Clean Slate! Please run: npm run dev');
