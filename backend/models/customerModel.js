const mongoose = require('mongoose');
const { Schema } = mongoose;

const CustomerSchema = new Schema({
   id: { type: Schema.Types.ObjectId, auto: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  loyaltyPoints: { type: Number, default: 0, min: 0 },
   bookingHistory: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
    reviewsGiven: [{ type: Schema.Types.ObjectId, ref: 'Review' }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);



