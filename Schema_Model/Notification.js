const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // FIX: Removed index:true — all indexes defined below
  },
  title: {
    type: String,
    required: true,
    trim: true,          // FIX: Added trim
    maxlength: 100       // FIX: Added maxlength — was unbounded
  },
  message: {
    type: String,
    required: true,
    trim: true,          // FIX: Added trim
    maxlength: 500       // FIX: Added maxlength — was unbounded
  },
  read: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  }
}, {
  timestamps: true
});

/*************************************************
 * INDEXES
 *
 * FIX 1: Added compound index { recipient, read } —
 *   The most common query is "unread notifications for user"
 *   (used in the notification badge count). The old single-field
 *   index on recipient alone was suboptimal for this pattern.
 *
 * FIX 2: Added compound index { recipient, createdAt } —
 *   The GET /api/notifications route sorts by createdAt desc.
 *   Without this, MongoDB sorts in memory after filtering.
 *
 * FIX 3: Added TTL index — notifications accumulate forever
 *   with no cleanup mechanism. Auto-expire after 60 days.
 *   Adjust the expireAfterSeconds value to fit your needs.
 *************************************************/
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 24 * 60 * 60 } // auto-delete after 60 days
);

module.exports = mongoose.model('Notification', NotificationSchema);
