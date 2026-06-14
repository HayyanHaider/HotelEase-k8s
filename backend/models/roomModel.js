const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
   id: { type: Schema.Types.ObjectId, auto: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  name: { type: String, required: true, trim: true },
   type: { type: String, required: true, enum: ['Single', 'Double', 'Twin', 'Suite', 'Deluxe', 'Family', 'Other'], default: 'Other' },
    description: { type: String, default: '' },
  pricePerNight: { type: Number, required: true, min: 0 },
   capacity: { type: Number, required: true, min: 1 },
    totalRooms: { type: Number, default: 1, min: 1 }, // Total rooms of this type
  availableRooms: { type: Number, default: 1, min: 0 }, // Available rooms of this type
   amenities: [{ type: String }],
    images: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
   isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
