const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'hr', 'employee'], required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Leave'], required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  checkInTime: { type: String },
  checkOutTime: { type: String },
  leaveType: { type: String } // Optional: Sick, Casual, etc.
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
