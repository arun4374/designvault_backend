const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  productId: {
    type: Number, // Using the static ID from frontend data
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userAvatar: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Prevent multiple reviews from same user for same product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);