const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'hr', 'employee'], required: true },
  employeeId: { type: String }, // For employees
  department: { type: String },
  designation: { type: String },
  profileImage: { type: String }, // URL or path to the profile image
  status: { type: String, enum: ['Active', 'On Leave'], default: 'Active' }
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);
