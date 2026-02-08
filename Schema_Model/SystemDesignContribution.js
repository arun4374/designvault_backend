const mongoose = require('mongoose');

const SystemDesignContributionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  categories: [String], // e.g., ['LLD', 'HLD', 'Design Patterns']
  
  authorName: { type: String, required: true },
  authorProfileUrl: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // System Design specific fields
  files: [{
    originalName: String,
    filename: String,
    path: String,
    description: String
  }],
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemDesignContribution', SystemDesignContributionSchema);