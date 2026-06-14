const BaseController = require('./BaseController');
const OwnerBookingService = require('../services/OwnerBookingService');

class OwnerBookingController extends BaseController {
   constructor() {
      super();
    this.ownerBookingService = OwnerBookingService;
   }

  getOwnerBookings = async (req, res) => {
     try {
        const ownerId = req.user.userId;
      const result = await this.ownerBookingService.getOwnerBookings(ownerId, req.query);
      
        return this.ok(res, {
        count: result.count,
         bookings: result.bookings
        });
    } catch (error) {
       console.error('Get owner bookings error:', error);
        return this.fail(res, 500, error.message || 'Server error while fetching bookings');
    }
   };

  confirmBooking = async (req, res) => {
     try {
        const ownerId = req.user.userId;
      const { bookingId } = req.params;

        const result = await this.ownerBookingService.confirmBooking(bookingId, ownerId);
      
       return this.ok(res, { message: result.message });
      } catch (error) {
      console.error('Confirm booking error:', error);
       const statusCode = error.message.includes('not found') || 
                          error.message.includes('Not authorized') ? 
                        (error.message.includes('not found') ? 404 : 403) : 500;
       return this.fail(res, statusCode, error.message || 'Server error while confirming booking');
      }
  };

    rejectBooking = async (req, res) => {
    try {
       const ownerId = req.user.userId;
        const { bookingId } = req.params;

       const result = await this.ownerBookingService.rejectBooking(bookingId, ownerId);
      
      return this.ok(res, { message: result.message });
     } catch (error) {
        console.error('Reject booking error:', error);
      const statusCode = error.message.includes('not found') || 
                         error.message.includes('Not authorized') ? 
                          (error.message.includes('not found') ? 404 : 403) : 500;
      return this.fail(res, statusCode, error.message || 'Server error while rejecting booking');
     }
    };

   checkIn = async (req, res) => {
      try {
      const ownerId = req.user.userId;
       const { bookingId } = req.params;

      const result = await this.ownerBookingService.checkIn(bookingId, ownerId);
      
        return this.ok(res, { message: result.message });
    } catch (error) {
       console.error('Check-in error:', error);
        const statusCode = error.message.includes('not found') || 
                        error.message.includes('Not authorized') ? 
                         (error.message.includes('not found') ? 404 : 403) : 500;
        return this.fail(res, statusCode, error.message || 'Server error during check-in');
    }
   };

  checkOut = async (req, res) => {
     try {
        const ownerId = req.user.userId;
      const { bookingId } = req.params;

        const result = await this.ownerBookingService.checkOut(bookingId, ownerId);
      
       return this.ok(res, { message: result.message });
      } catch (error) {
      console.error('Check-out error:', error);
       const statusCode = error.message.includes('not found') || 
                          error.message.includes('Not authorized') ? 
                        (error.message.includes('not found') ? 404 : 403) : 500;
       return this.fail(res, statusCode, error.message || 'Server error during check-out');
      }
  };
}

module.exports = new OwnerBookingController();
