const mongoose = require('mongoose');

const SystemDesignContributionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  category: { type: String, required: true },
  types: { type: String, required: true },
  
  authorName: { type: String, required: true },
  authorProfileUrl: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // System Design specific fields
  files: [{
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    description: String,
    size: {
      type: Number,
      required: true,
      validate: {
        validator: function(v) { return v <= 204800; }, // Max 200KB (200 * 1024)
        message: 'File size must be less than 200KB'
      }
    },
    extension: {
      type: String,
      required: true,
      enum: ['java', 'c', 'cpp', 'py'],
      lowercase: true
    },
    mimetype: String,
    hash: String // Store file hash for security/integrity checks
  }],
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemDesignContribution', SystemDesignContributionSchema);
