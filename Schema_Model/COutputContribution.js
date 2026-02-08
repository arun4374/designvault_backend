const mongoose = require('mongoose');

const COutputContributionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  category: { type: String, default: 'General' }, // e.g., Pointers, Macros
  
  authorName: { type: String, required: true },
  authorProfileUrl: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // C-Output specific fields
  codeSnippet: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  explanation: { type: String, required: true },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('COutputContribution', COutputContributionSchema);
