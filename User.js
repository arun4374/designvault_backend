const mongoose = require('mongoose');

/*************************************************
 * USER SCHEMA
 *************************************************/

const UserSchema = new mongoose.Schema({

  googleId: {
    type: String,
    required: true,
    unique: true
    // FIX: Removed index:true here — unique:true already
    //      creates an index automatically. Declaring both
    //      caused MongoDB to build two indexes on the same
    //      field, wasting memory and slowing writes.
  },

  name: {
    type: String,
    required: true,       // FIX: Added required — a user with no name
    trim: true,           //      breaks profile display and notification
    maxlength: 100        //      messages ("undefined submitted a contribution")
  },

  email: {
    type: String,
    required: true,
    unique: true,         // unique already creates an index — no need for index:true
    lowercase: true,
    trim: true,
    // FIX: Added format validation — without this, any string
    //      (e.g. "hello") is accepted as a valid email
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },

  avatar: {
    type: String,
    trim: true
  },

  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'AUTHOR'],
    default: 'USER'
    // FIX: Removed index:true — duplicate of the explicit
    //      index defined below. Same double-index problem.
  },

  bio: {
    type: String,
    trim: true,           // FIX: Added trim — was missing, inconsistent with name/email
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
    default: 0,
    min: 0              // FIX: Added min — should never go negative
  },

  totalLikesReceived: {
    type: Number,
    default: 0,
    min: 0              // FIX: Added min — should never go negative
  },

  /******** SAAS CREDITS ********/

  credits: {
    type: Number,
    default: 100,
    min: 0
  }

}, {
  timestamps: true
});


/*************************************************
 * INDEXES
 * Only define indexes here, not in field definitions,
 * to keep a single clear source of truth and avoid
 * duplicate indexes being created in MongoDB.
 *************************************************/

UserSchema.index({ createdAt: -1 });  // for admin user list sorted by newest
UserSchema.index({ email: 1 });       // for login lookups by email
UserSchema.index({ role: 1 });        // for admin-only queries (User.find({ role: 'ADMIN' }))


module.exports = mongoose.model('User', UserSchema);
