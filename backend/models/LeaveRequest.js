const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true },
  startDate: { type: String, required: true }, // Format: YYYY-MM-DD
  endDate: { type: String, required: true },   // Format: YYYY-MM-DD
  reason: { type: String, required: true },
  leaveType: { type: String, enum: ['Sick', 'Casual', 'Earned', 'Other'], default: 'Casual' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
