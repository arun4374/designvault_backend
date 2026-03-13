const mongoose = require('mongoose');

const DSAContributionSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },

  slug: {
    type: String,
    required: true,      // FIX: Was missing required:true — the only contribution
    unique: true,        //      schema without it, meaning slugless DSA docs could
    lowercase: true,     //      be saved, breaking all slug-based lookups silently.
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
    // FIX: Removed index:true — covered by compound index below
  },

  category: {
    type: String,
    required: true,
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

  /******** DSA CONTENT ********/

  codeLanguage: {
    type: String,
    enum: ['java', 'c', 'cpp', 'python'],
    default: 'java'
    // FIX: Removed index:true — covered by compound index below
    // NOTE: lowercase:true is redundant here since the enum
    //       already enforces lowercase values
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

DSAContributionSchema.index({ createdAt: -1 });
DSAContributionSchema.index({ userId: 1 });

// Full-text search
DSAContributionSchema.index({
  title: 'text',
  description: 'text',
  explanation: 'text'
});

// Compound filter
DSAContributionSchema.index({ status: 1, difficulty: 1, category: 1 });

// Language filter (common query: "show all approved Java DSA questions")
DSAContributionSchema.index({ codeLanguage: 1, status: 1 });

module.exports = mongoose.model('DSAContribution', DSAContributionSchema);
