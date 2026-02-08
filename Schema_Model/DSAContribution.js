const mongoose = require('mongoose');

const DSAContributionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, // Problem statement
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  category: { type: String, required: true }, // e.g., Arrays, DP, Graphs
  
  authorName: { type: String, required: true },
  authorProfileUrl: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // DSA specific fields
  codeLanguage: { type: String, default: 'java' },
  codeSnippet: { type: String, required: true },
  explanation: String,
  timeComplexity: String,
  spaceComplexity: String,
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DSAContribution', DSAContributionSchema);