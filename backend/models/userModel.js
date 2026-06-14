// models/userModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    // id field is removed to use default _id and virtual id getter
  name: { type: String, required: true, trim: true },
   email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
  phone: { type: String, trim: true, default: '' },
   role: { type: String, enum: ['customer', 'hotel', 'admin'], default: 'customer', index: true },
    isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
   suspendedReason: { type: String, default: '' },
    suspendedAt: { type: Date, default: null },
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Hotel' }],
   walletBalance: { type: Number, default: 0, min: 0 },
    // Gmail OAuth2 tokens for sending emails from user's account
  gmailTokens: {
     access_token: { type: String },
      refresh_token: { type: String },
    expiry_date: { type: Number },
     token_type: { type: String, default: 'Bearer' },
      scope: { type: String }
  },
   gmailAuthorized: { type: Boolean, default: false },
    gmailAuthorizedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
