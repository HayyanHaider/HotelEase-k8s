// models/bookingModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingSchema = new Schema({
    id: { type: Schema.Types.ObjectId, auto: true },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
  couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
   checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
  nights: { type: Number, required: true, min: 1 },
   taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
   status: { type: String, required: true },
    confirmedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
   guests: { type: Number, required: true, min: 1 },
    priceSnapshot: {
    basePricePerDay: { type: Number, default: 0 },
     nights: { type: Number, default: 0 },
      basePriceTotal: { type: Number, default: 0 },
    cleaningFee: { type: Number, default: 0 },
     serviceFee: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
     discounts: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
     couponDiscountPercentage: { type: Number, default: null }
    },
  invoicePath: { type: String, default: '' },
   invoiceUrl: { type: String, default: '' },
    cloudinaryPublicId: { type: String, default: '' },
  autoConfirmedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
