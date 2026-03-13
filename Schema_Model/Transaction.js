const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // FIX: Removed index:true — defined explicitly below
  },
  amount: {
    type: Number,
    required: true,
    // Positive = credit earned, Negative = deduction.
    // FIX: Added validate to reject zero — a transaction of 0
    //      has no meaning and is most likely a bug.
    validate: {
      validator: (v) => v !== 0,
      message: 'Transaction amount cannot be zero'
    }
  },
  type: {
    type: String,
    enum: ['DAILY_LOGIN', 'CONTRIBUTION_APPROVED', 'SIGNUP_BONUS', 'DOWNLOAD_DEDUCTION', 'OTHER'],
    required: true
  },
  description: {
    type: String,
    trim: true,          // FIX: Added trim
    maxlength: 200       // FIX: Added maxlength — was unbounded
  }
}, {
  timestamps: true
});

/*************************************************
 * INDEXES
 * FIX: Added createdAt index — the GET /api/transactions
 *      route sorts by createdAt desc. Without this index,
 *      MongoDB was sorting the entire userId result set
 *      in memory on every request.
 *************************************************/
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ userId: 1, createdAt: -1 }); // covers sorted user transaction history

module.exports = mongoose.model('Transaction', TransactionSchema);
