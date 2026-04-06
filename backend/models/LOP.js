const mongoose = require('mongoose');

const LOPSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  delayDays: { type: Number, required: true },
  reason: { type: String, default: 'Task not completed within deadline. No proper update provided.' },
  lopStatus: { type: String, enum: ['Pending', 'Applied', 'Waived'], default: 'Pending' },
  warningsSent: { type: Number, default: 0 } // 0 = none, 1 = first warning, 2 = final warning
}, { timestamps: true });

module.exports = mongoose.model('LOP', LOPSchema);
