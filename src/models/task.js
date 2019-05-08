const mongoose = require('mongoose')

// Define the Task Schema
const taskSchema =  new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Create the model
const Task = mongoose.model('Task', taskSchema)

module.exports = Task
