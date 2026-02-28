const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
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
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);