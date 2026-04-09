const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const dns = require('dns');

// Force DNS resolution to Google Public DNS to avoid SRV query issues on local networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('🌐 DNS resolution paths secured (Google DNS)');
} catch (e) {
  console.warn('⚠️  Note: Custom DNS configuration failed, using system defaults.');
}

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5177",
  "http://localhost:3000",
  /\.vercel\.app$/,       // any Vercel deployment
  /\.railway\.app$/,      // Railway hosted frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests
    const isAllowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    isAllowed ? callback(null, true) : callback(new Error('CORS: origin not allowed'));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

const io = new Server(server, {
  cors: { ...corsOptions, methods: ["GET", "POST", "PUT"] }
});

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('📁 Created uploads directory');
}

// Socket.io User Map
const userSockets = new Map();

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// Pass io to routes
app.set('io', io);
app.set('userSockets', userSockets);

// Routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/tasks', require('./routes/taskRoute'));
app.use('/api/users', require('./routes/userRoute'));
app.use('/api/projects', require('./routes/projectRoute'));
app.use('/api/notifications', require('./routes/notificationRoute'));
app.use('/api/attendance', require('./routes/attendanceRoute'));
app.use('/api/leaves', require('./routes/leaveRoute'));
app.use('/api/lop', require('./routes/lopRoute'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: 'online', 
    timestamp: new Date(),
    database: statusMap[dbStatus] || 'unknown',
    dbReady: dbStatus === 1
  });
});


// Global Error Handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Optional: keep the server running if it's safe OR exit gracefully
  // process.exit(1); 
});

const PORT = process.env.PORT || 5001;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Critical: Port ${PORT} is already in use by another process.`);
  } else {
    console.error('❌ Critical: Server failed to start:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FIC Backend Service is online on port ${PORT}`);
    let uri = (process.env.MONGO_URI || '').trim();
    // Strip accidental quotes if they were pasted into environment variables
    if (uri.startsWith('"') && uri.endsWith('"')) uri = uri.substring(1, uri.length - 1);
    if (uri.startsWith("'") && uri.endsWith("'")) uri = uri.substring(1, uri.length - 1);
    
    // Final fallback
    if (!uri) uri = 'mongodb://127.0.0.1:27017/taskmanagementsystem';
    
    console.log(`📡 URI prefix check: ${uri.substring(0, 15)}...`);
    
    mongoose.connect(uri)
      .then(() => {
        console.log('✅ Successfully connected to MongoDB Central');
        console.log(`📂 Database: ${mongoose.connection.name}`);
      })
      .catch((err) => {
        console.error('❌ Critical: MongoDB Connection Failed');
        console.error(`📝 Error Detail: ${err.message}`);
        console.log('⚠️  The server is running but authentication and data features will be restricted.');
        console.log('💡 TIP: Check if your IP address is whitelisted in MongoDB Atlas or if the MONGO_URI is correct.');
      });
});

