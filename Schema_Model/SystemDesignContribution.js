const mongoose = require('mongoose');

/*************************************************
 * FILE SUB-SCHEMA
 *************************************************/

const FileSchema = new mongoose.Schema({

  originalName: {
    type: String,
    required: true,
    trim: true
  },

  filename: {
    type: String,
    required: true,
    trim: true
  },

  path: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  size: {
    type: Number,
    required: true,
    min: 1,
    max: 300 * 1024   // 300KB
  },

  extension: {
    type: String,
    required: true,
    // FIX: CRITICAL — enum values were missing the leading dot.
    //      path.extname() (used in index.js) returns '.java', '.c' etc.
    //      The old enum ['txt','java','c','cpp','py'] never matched,
    //      so the extension field was silently storing invalid values
    //      (or failing validation entirely on strict schemas).
    enum: ['.txt', '.java', '.c', '.cpp', '.py'],
    lowercase: true
  },

  mimetype: {
    type: String,
    trim: true
  },

  hash: {
    type: String,
    index: true         // helps detect duplicate file uploads
  }

}, { _id: false });


/*************************************************
 * MAIN SCHEMA
 *************************************************/

const SystemDesignContributionSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },

  slug: {
    type: String,
    required: true,     // FIX: Was missing required:true — same issue as DSAContribution
    unique: true,       // unique already creates an index
    lowercase: true,
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
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
    // FIX: Removed index:true — covered by compound index below
  },

  category: {
    type: String,
    required: true,
    trim: true          // FIX: Added trim
    // FIX: Removed index:true — covered by compound index below
  },

  designType: {
    type: String,
    required: true,
    trim: true          // FIX: Added trim
  },

  authorName: {
    type: String,
    required: true,
    trim: true          // FIX: Added trim
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

  files: [FileSchema],

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
 * FIX: Removed duplicate SystemDesignContributionSchema.index({ slug: 1 })
 *      — slug has unique:true which already creates an index automatically.
 *************************************************/

SystemDesignContributionSchema.index({ createdAt: -1 });
SystemDesignContributionSchema.index({ userId: 1 });
SystemDesignContributionSchema.index({ status: 1, createdAt: -1 });
SystemDesignContributionSchema.index({ status: 1, difficulty: 1, category: 1 });

module.exports = mongoose.model(
  'SystemDesignContribution',
  SystemDesignContributionSchema
);
