const mongoose = require('mongoose');

/*************************************************
 * MAIN SCHEMA
 *************************************************/

const DSAContributionSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
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
    required: true,
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

  /******** DSA CONTENT ********/

  codeLanguage: {
    type: String,
    enum: ['java', 'c', 'cpp', 'python'],
    default: 'java',
    lowercase: true,
    index: true
  },

  codeSnippet: {
    type: String,
    required: true,
    minlength: 10
  },

  explanation: {
    type: String,
    trim: true
  },

  timeComplexity: {
    type: String,
    trim: true
  },

  spaceComplexity: {
    type: String,
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

// Fast listing
DSAContributionSchema.index({ createdAt: -1 });

// Search
DSAContributionSchema.index({
  title: 'text',
  description: 'text',
  explanation: 'text'
});

// Filter
DSAContributionSchema.index({
  status: 1,
  difficulty: 1,
  category: 1
});


module.exports = mongoose.model(
  'DSAContribution',
  DSAContributionSchema
);
