const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  projectKey: { type: String, required: true, unique: true, uppercase: true }, // e.g. WEB, IT, HR
  description: { type: String },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // HR or Admin
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  projectType: { 
    type: String, 
    enum: ['Software Project', 'Task Management Project'], 
    default: 'Software Project' 
  },
  status: { 
    type: String, 
    enum: ['Planning', 'Active', 'On Hold', 'Completed'], 
    default: 'Active' 
  },
  priority: { 
    type: String, 
    enum: ['High', 'Medium', 'Low'], 
    default: 'Medium' 
  },
  deadline: { type: Date },
  instructions: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
