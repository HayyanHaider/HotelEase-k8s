class IBookingService {
   async createBooking(bookingData, userId) {
      throw new Error('createBooking method must be implemented');
  }

    async getUserBookings(userId, filters = {}) {
    throw new Error('getUserBookings method must be implemented');
   }

  async getBookingById(bookingId, userId) {
     throw new Error('getBookingById method must be implemented');
    }

   async cancelBooking(bookingId, userId, reason = '') {
      throw new Error('cancelBooking method must be implemented');
  }

    async rescheduleBooking(bookingId, userId, newDates) {
    throw new Error('rescheduleBooking method must be implemented');
   }
}

module.exports = IBookingService;

