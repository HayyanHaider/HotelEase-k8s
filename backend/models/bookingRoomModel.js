const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingRoomSchema = new Schema({
   id: { type: Schema.Types.ObjectId, auto: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
   quantity: { type: Number, required: true, min: 1 }
}, { timestamps: true });

module.exports = mongoose.model('BookingRoom', BookingRoomSchema);



