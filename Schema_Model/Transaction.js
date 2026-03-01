const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['DAILY_LOGIN', 'CONTRIBUTION_APPROVED', 'SIGNUP_BONUS', 'DOWNLOAD_DEDUCTION', 'OTHER'],
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);
