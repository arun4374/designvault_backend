const mongoose = require('mongoose');

const COutputContributionSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },

  slug: {
    type: String,
    required: true,
    unique: true,        // unique already creates an index
    lowercase: true,
    trim: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
    // FIX: Removed index:true — this field is covered by the
    //      compound index { status, difficulty, category } below.
    //      Having index:true here as well created a duplicate index.
  },

  category: {
    type: String,
    default: 'General',
    trim: true           // FIX: Added trim — was missing
    // FIX: Removed index:true — covered by compound index below
  },

  authorName: {
    type: String,
    required: true,
    trim: true           // FIX: Added trim
  },

  authorProfileUrl: {
    type: String,
    trim: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // FIX: Removed index:true — defined explicitly below
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
    default: 'pending'
    // FIX: Removed index:true — covered by compound index below
  },

  /******** METRICS ********/

  views: {
    type: Number,
    default: 0,
    min: 0              // FIX: Counters should never go negative
  },

  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },

  commentsCount: {
    type: Number,
    default: 0,
    min: 0
  }

}, {
  timestamps: true
});

/*************************************************
 * INDEXES
 *************************************************/

COutputContributionSchema.index({ createdAt: -1 });
COutputContributionSchema.index({ userId: 1 });

// Full-text search
COutputContributionSchema.index({
  title: 'text',
  description: 'text',
  explanation: 'text'
});

// Compound filter (status + difficulty + category in one query)
COutputContributionSchema.index({ status: 1, difficulty: 1, category: 1 });

module.exports = mongoose.model('COutputContribution', COutputContributionSchema);
