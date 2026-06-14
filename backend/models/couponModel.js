const mongoose = require('mongoose');
const { Schema } = mongoose;

const CouponSchema = new Schema({
   id: { type: Schema.Types.ObjectId, auto: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  code: { type: String, required: true, trim: true, uppercase: true, unique: true },
   discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
   isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: null },
  currentUses: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);



