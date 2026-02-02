const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    required: true
  },
  name: String,
  email: String,
  avatar: String,

  role: {
    type: String,
    default: 'USER' // USER | ADMIN | AUTHOR
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  lastLoginAt: Date
});

module.exports = mongoose.model('User', UserSchema);
