const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['task_assignment', 'task_status_update', 'task_comment', 'project_assignment', 'alert'], 
    required: true 
  },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  status: { 
    type: String, 
    enum: ['Read', 'Unread', 'Archived'], 
    default: 'Unread' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
