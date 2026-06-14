const BaseController = require('./BaseController');
const BookingService = require('../services/BookingService');

class BookingController extends BaseController {
   constructor() {
      super();
    this.bookingService = BookingService;
   }

  createBooking = async (req, res) => {
     try {
      const userId = req.user?.userId;
    
     if (!userId) {
          return this.fail(res, 401, 'User not authenticated');
      }

        const result = await this.bookingService.createBooking(req.body, userId);
      
       return this.created(res, {
          message: 'Booking created successfully',
        booking: result.booking,
         appliedCoupon: result.appliedCoupon
      });
  } catch (error) {
     console.error('Create booking error:', error);
        return this.fail(res, 500, error.message || 'Server error while creating booking');
    }
   };

  getUserBookings = async (req, res) => {
   try {
      const userId = req.user?.userId;
      
     if (!userId) {
          return this.fail(res, 401, 'User not authenticated');
      }

        const result = await this.bookingService.getUserBookings(userId, req.query);
      
       return this.ok(res, {
          count: result.count,
        bookings: result.bookings
       });
    } catch (error) {
    console.error('Get user bookings error:', error);
       return this.fail(res, 500, error.message || 'Server error while fetching bookings');
      }
  };

    getBookingDetails = async (req, res) => {
    try {
       const userId = req.user?.userId;
      const { bookingId } = req.params;
    
     if (!userId) {
          return this.fail(res, 401, 'User not authenticated');
      }

        const booking = await this.bookingService.getBookingById(bookingId, userId);
      
       return this.ok(res, { booking });
      } catch (error) {
      console.error('Get booking details error:', error);
       const statusCode = error.message.includes('not found') ? 404 : 500;
        return this.fail(res, statusCode, error.message || 'Server error while fetching booking details');
    }
   };

  cancelBooking = async (req, res) => {
     try {
        const userId = req.user?.userId;
      const { bookingId } = req.params;
       const { reason = '' } = req.body;
      
      if (!userId) {
         return this.fail(res, 401, 'User not authenticated');
        }

       const result = await this.bookingService.cancelBooking(bookingId, userId, reason);
      
      return this.ok(res, { message: result.message });
   } catch (error) {
      console.error('Cancel booking error:', error);
      const statusCode = error.message.includes('not found') || 
                         error.message.includes('Cannot cancel') ||
                          error.message.includes('already cancelled') ? 400 : 500;
      return this.fail(res, statusCode, error.message || 'Server error while cancelling booking');
     }
    };

   rescheduleBooking = async (req, res) => {
      try {
    const userId = req.user?.userId;
     const { bookingId } = req.params;
    
    if (!userId) {
         return this.fail(res, 401, 'User not authenticated');
        }

       const result = await this.bookingService.rescheduleBooking(
          bookingId,
        userId,
         req.body
        );
      
       return this.ok(res, {
          message: result.message,
        booking: result.booking
       });
      } catch (error) {
      console.error('Reschedule booking error:', error);
       const statusCode = error.message.includes('not found') || 
                          error.message.includes('Can only reschedule') ||
                        error.message.includes('fully booked') ||
                         error.message.includes('cannot be in the past') ||
                          error.message.includes('must be after') ? 400 : 500;
      return this.fail(res, statusCode, error.message || 'Server error while rescheduling booking');
     }
    };
}

module.exports = new BookingController();
