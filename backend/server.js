const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT"]
  }
});

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

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
  res.json({ 
    status: 'online', 
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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

server.listen(PORT, () => {
    console.log(`🚀 FIC Backend Service is online on port ${PORT}`);
    console.log(`📡 Attempting connection to MongoDB Hub...`);
    
    mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanagementsystem')
      .then(() => {
        console.log('✅ Successfully connected to MongoDB Central');
      })
      .catch((err) => {
        console.error('❌ Critical: MongoDB Connection Failed', err.message);
        console.log('⚠️  The server is running but data persistent features will be unavailable.');
      });
});

