const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminSchema = new Schema({
   id: { type: Schema.Types.ObjectId, auto: true },
    assignedRegion: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);



