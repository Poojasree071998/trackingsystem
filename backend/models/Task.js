const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  taskTitle: { type: String, required: true },
  taskDescription: { type: String, required: true },
  issueType: { type: String, enum: ['Task', 'Bug', 'Story', 'Interview'], default: 'Task' },
  assignedByHR: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedToEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deadline: { type: Date, required: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  status: { 
    type: String, 
    enum: ['To Do', 'In Progress', 'Under Review', 'Completed', 'Rejected', 'Overdue'], 
    default: 'To Do' 
  },
  taskDate: { type: String }, // Scheduled date
  taskTime: { type: String }, // Scheduled time
  attachment: { type: String },
  notes: { type: String },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });


module.exports = mongoose.model('Task', TaskSchema);
