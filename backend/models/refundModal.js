const mongoose = require('mongoose');
const { Schema } = mongoose;

const RefundSchema = new Schema({
   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
   amount: { type: Number, required: true, min: 0 },
    reason: {
    type: String,
     enum: ['cancellation', 'service_issue', 'billing_error', 'fraud', 'other'],
      required: true
  },
   description: { type: String, required: true, trim: true },
    status: {
    type: String,
     enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending'
  },
   adminNotes: { type: String, default: '' },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  processedAt: { type: Date, default: null },
   requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Use existing collection name to keep data
module.exports = mongoose.model('Refund', RefundSchema, 'refundrequests');


