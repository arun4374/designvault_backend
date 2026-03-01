const mongoose = require('mongoose');

/*************************************************
 * USER SCHEMA
 *************************************************/

const UserSchema = new mongoose.Schema({

  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  name: {
    type: String,
    trim: true,
    maxlength: 100
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  avatar: String,

  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'AUTHOR'],
    default: 'USER',
    index: true
  },

  bio: {
    type: String,
    maxlength: 300
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastLoginAt: {
    type: Date
  },

  /******** PLATFORM METRICS ********/

  totalContributions: {
    type: Number,
    default: 0
  },

  totalLikesReceived: {
    type: Number,
    default: 0
  },

  /******** SAAS CREDITS ********/

  credits: {
    type: Number,
    default: 100, // Professional starting balance
    min: 0
  }

}, {
  timestamps: true
});


/*************************************************
 * INDEXES
 *************************************************/

UserSchema.index({ createdAt: -1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });


module.exports = mongoose.model('User', UserSchema);
