const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  productId: {
    type: Number,
    required: true
    // FIX: Removed index:true — the compound unique index
    //      { productId, userId } below already covers queries
    //      that filter by productId alone (MongoDB can use the
    //      left-most prefix of a compound index). Duplicate.
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    trim: true           // FIX: Added trim
  },
  userAvatar: {
    type: String,
    trim: true           // FIX: Added trim
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,          // FIX: Added trim — leading/trailing whitespace was stored as-is
    minlength: 1,        // FIX: Added minlength — empty strings passed required check
    maxlength: 500
  }
}, {
  timestamps: true
});

// Prevents multiple reviews from the same user for the same product.
// The compound unique index also serves as the index for productId queries.
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
