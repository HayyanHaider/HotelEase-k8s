const BaseRepository = require('./BaseRepository');
const BookingModel = require('../models/bookingModel');

class BookingRepository extends BaseRepository {
   constructor() {
      super(BookingModel);
  }

    async findByUser(userId, options = {}) {
    return this.find({ userId }, options);
   }

  async findByHotel(hotelId, options = {}) {
     return this.find({ hotelId }, options);
    }

   async findByStatus(status, options = {}) {
      return this.find({ status }, options);
  }

    async findOverlapping(hotelId, checkIn, checkOut, excludeStatuses = ['cancelled']) {
    try {
       const docs = await this.model.find({
          hotelId,
        status: { $nin: excludeStatuses },
         checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn }
      });
       return docs.map(doc => this.toObject(doc));
      } catch (error) {
      throw new Error(`Error finding overlapping bookings: ${error.message}`);
     }
    }

   async findActive(criteria = {}, options = {}) {
      const now = new Date();
    return this.find({
       ...criteria,
        status: { $in: ['confirmed', 'pending'] },
      checkOut: { $gte: now }
     }, options);
    }
}

module.exports = new BookingRepository();

