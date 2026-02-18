const mongoose = require('mongoose');

/*************************************************
 * MAIN SCHEMA
 *************************************************/

const COutputContributionSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },

  slug: {
    type: String,
    lowercase: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true
  },

  category: {
    type: String,
    default: 'General',
    index: true
  },

  authorName: {
    type: String,
    required: true
  },

  authorProfileUrl: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  /******** C OUTPUT CONTENT ********/

  codeSnippet: {
    type: String,
    required: true,
    minlength: 5
  },

  expectedOutput: {
    type: String,
    required: true,
    trim: true
  },

  explanation: {
    type: String,
    required: true,
    trim: true
  },

  /******** MODERATION ********/

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },

  /******** BLOG METRICS ********/

  views: {
    type: Number,
    default: 0
  },

  likesCount: {
    type: Number,
    default: 0
  },

  commentsCount: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});


/*************************************************
 * INDEXES
 *************************************************/

// Recent first
COutputContributionSchema.index({ createdAt: -1 });

// Search
COutputContributionSchema.index({
  title: 'text',
  description: 'text',
  explanation: 'text'
});

// Filter
COutputContributionSchema.index({
  status: 1,
  difficulty: 1,
  category: 1
});


module.exports = mongoose.model(
  'COutputContribution',
  COutputContributionSchema
);

