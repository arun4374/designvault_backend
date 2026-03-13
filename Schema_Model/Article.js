const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true, // unique already creates an index
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500       // FIX: Added maxlength — was unbounded
  },
  content: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50        // FIX: Added maxlength per tag
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0,
    min: 0              // FIX: Counter should never go negative
  },
  likes: {
    type: Number,
    default: 0,
    min: 0              // FIX: Counter should never go negative
  }
}, {
  timestamps: true
});

/*************************************************
 * INDEXES
 * FIX: Article had zero indexes defined.
 *      slug is queried on every single article page load.
 *      status is queried on every public listing.
 *      Both were doing full collection scans.
 *************************************************/
ArticleSchema.index({ status: 1, createdAt: -1 }); // public listing: find published, newest first
ArticleSchema.index({ author: 1 });                // admin: articles by author
ArticleSchema.index({ category: 1, status: 1 });   // filter by category

module.exports = mongoose.model('Article', ArticleSchema);
