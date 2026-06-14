const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
   id: { type: Schema.Types.ObjectId, auto: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
   amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true },
  type: { type: String, default: 'booking_payment' },
   status: { type: String, required: true },
    transactionId: { type: String, default: null },
  processedAt: { type: Date, default: null },
   failureReason: { type: String, default: null },
    refundStatus: { type: String, default: 'not_refunded' },
  refundedAt: { type: Date, default: null },
   refundReason: { type: String, default: null },
    originalPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null }
}, { timestamps: true });

PaymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', PaymentSchema);
