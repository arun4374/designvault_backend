const mongoose = require('mongoose');

/*************************************************
 * FILE SUB-SCHEMA
 *************************************************/

const FileSchema = new mongoose.Schema({

  originalName: {
    type: String,
    required: true
  },

  filename: {
    type: String,
    required: true
  },

  path: {
    type: String,
    required: true
  },

  description: String,

  size: {
    type: Number,
    required: true,
    max: 300 * 1024 // 300KB
  },

  extension: {
    type: String,
    required: true,
    enum: ['txt', 'java', 'c', 'cpp', 'py'],
    lowercase: true
  },

  mimetype: String,

  hash: {
    type: String,
    index: true // helps detect duplicate files
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
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate',
    index: true
  },

  category: {
    type: String,
    required: true,
    index: true
  },

  designType: {  // renamed from types
    type: String,
    required: true
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

  files: [FileSchema],

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },

  // BLOG METRICS
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
  timestamps: true // adds createdAt + updatedAt automatically
});


/*************************************************
 * INDEXES (IMPORTANT FOR PERFORMANCE)
 *************************************************/

SystemDesignContributionSchema.index({ createdAt: -1 });
SystemDesignContributionSchema.index({ slug: 1 });
SystemDesignContributionSchema.index({ status: 1, createdAt: -1 });


module.exports = mongoose.model(
  'SystemDesignContribution',
  SystemDesignContributionSchema
);
