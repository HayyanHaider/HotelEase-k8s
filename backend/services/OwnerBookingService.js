const BaseService = require('./BaseService');
const BookingRepository = require('../repositories/BookingRepository');
const HotelRepository = require('../repositories/HotelRepository');
const UserRepository = require('../repositories/UserRepository');
const { sendEmail, emailTemplates } = require('../utils/emailService');

class OwnerBookingService extends BaseService {
   constructor(dependencies = {}) {
      super(dependencies);
    this.bookingRepository = dependencies.bookingRepository || BookingRepository;
     this.hotelRepository = dependencies.hotelRepository || HotelRepository;
      this.userRepository = dependencies.userRepository || UserRepository;
  }

    async getOwnerBookings(ownerId, filters = {}) {
    try {
       const hotels = await this.hotelRepository.find({ 
          ownerId, 
        isSuspended: { $ne: true } 
       });

      const hotelIds = hotels.map(h => h._id);

        if (hotelIds.length === 0) {
        return { bookings: [] };
       }

      const query = { hotelId: { $in: hotelIds } };
       if (filters.status) {
          query.status = filters.status;
      }

        const options = {
        populate: [
           {
              path: 'hotelId',
            select: 'name address isSuspended',
             match: { isSuspended: { $ne: true } }
            },
          { path: 'userId', select: 'name email' }
         ],
          sort: { createdAt: -1 }
      };

        const bookings = await this.bookingRepository.find(query, options);

       const filteredBookings = bookings.filter(booking => booking.hotelId !== null);

      return {
         count: filteredBookings.length,
          bookings: filteredBookings
      };
     } catch (error) {
        this.handleError(error, 'Get owner bookings');
    }
   }

  async confirmBooking(bookingId, ownerId) {
     try {
        const booking = await this.bookingRepository.findById(bookingId, {
        populate: [
           { path: 'hotelId', select: 'name location ownerId' },
            { path: 'userId', select: 'name email' }
        ]
       });

      if (!booking) {
         throw new Error('Booking not found');
        }

       const hotel = booking.hotelId;
        if (!hotel || String(hotel.ownerId) !== String(ownerId)) {
        throw new Error('Not authorized');
       }

      await this.bookingRepository.updateById(bookingId, {
         status: 'confirmed',
          confirmedBy: 'hotel',
        confirmedAt: new Date()
       });

      this.#sendConfirmationEmail(bookingId, booking).catch(err =>
         console.error('Error sending confirmation email:', err)
        );

       return { message: 'Booking confirmed' };
      } catch (error) {
      this.handleError(error, 'Confirm booking');
     }
    }

   async rejectBooking(bookingId, ownerId) {
      try {
      const booking = await this.bookingRepository.findById(bookingId, {
         populate: [{ path: 'hotelId', select: 'ownerId' }]
        });

       if (!booking) {
          throw new Error('Booking not found');
      }

        const hotel = booking.hotelId;
      if (!hotel || String(hotel.ownerId) !== String(ownerId)) {
         throw new Error('Not authorized');
        }

       await this.bookingRepository.updateById(bookingId, {
          status: 'rejected'
      });

        return { message: 'Booking rejected' };
    } catch (error) {
       this.handleError(error, 'Reject booking');
      }
  }

    async checkIn(bookingId, ownerId) {
    try {
       const booking = await this.bookingRepository.findById(bookingId, {
          populate: [{ path: 'hotelId', select: 'ownerId' }]
      });

        if (!booking) {
        throw new Error('Booking not found');
       }

      const hotel = booking.hotelId;
       if (!hotel || String(hotel.ownerId) !== String(ownerId)) {
          throw new Error('Not authorized');
      }

        await this.bookingRepository.updateById(bookingId, {
        status: 'checked-in',
         checkedInAt: new Date()
        });

       return { message: 'Guest checked in' };
      } catch (error) {
      this.handleError(error, 'Check-in booking');
     }
    }

   async checkOut(bookingId, ownerId) {
      try {
      const booking = await this.bookingRepository.findById(bookingId, {
         populate: [{ path: 'hotelId', select: 'ownerId' }]
        });

       if (!booking) {
          throw new Error('Booking not found');
      }

        const hotel = booking.hotelId;
      if (!hotel || String(hotel.ownerId) !== String(ownerId)) {
         throw new Error('Not authorized');
        }

       await this.bookingRepository.updateById(bookingId, {
          status: 'checked-out',
        checkedOutAt: new Date()
       });

      return { message: 'Guest checked out' };
     } catch (error) {
        this.handleError(error, 'Check-out booking');
    }
   }

  async #sendConfirmationEmail(bookingId, booking) {
     try {
        if (!booking.userId || !booking.userId.email) {
        return;
       }

      const updatedBooking = await this.bookingRepository.findById(bookingId, {
         populate: [
            { path: 'hotelId', select: 'name location address' },
          { path: 'couponId', select: 'code discountPercentage' }
         ]
        });

       const customer = booking.userId;
        const hotel = updatedBooking.hotelId;
      const checkIn = new Date(updatedBooking.checkIn).toLocaleDateString();
       const checkOut = new Date(updatedBooking.checkOut).toLocaleDateString();
        const nights = updatedBooking.nights || 1;

       const emailTemplate = {
          subject: `Booking Confirmed - ${hotel.name || 'Hotel'} (${bookingId})`,
        html: `
           <!DOCTYPE html>
            <html>
          <head>
             <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
               .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
              .booking-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745; }
               .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .detail-row:last-child { border-bottom: none; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
             </style>
            </head>
          <body>
             <div class="container">
                <div class="header">
                <h1>🎉 Booking Confirmed!</h1>
                 <p style="margin: 10px 0 0 0; font-size: 16px;">Your reservation has been confirmed</p>
                </div>
              <div class="content">
                 <p>Dear ${customer.name || 'Customer'},</p>
                  <p style="font-size: 16px; color: #28a745; font-weight: bold;">✅ Your booking has been confirmed by the hotel!</p>
                <p>We're excited to host you! Please find your booking details below:</p>
                
                  <div class="booking-details">
                  <h2>Booking Information</h2>
                   <div class="detail-row">
                      <strong>Booking ID:</strong>
                    <span>${bookingId}</span>
                   </div>
                    <div class="detail-row">
                    <strong>Hotel:</strong>
                     <span>${hotel.name || 'Hotel'}</span>
                    </div>
                  <div class="detail-row">
                     <strong>Check-in:</strong>
                      <span>${checkIn}</span>
                  </div>
                   <div class="detail-row">
                      <strong>Check-out:</strong>
                    <span>${checkOut}</span>
                   </div>
                    <div class="detail-row">
                    <strong>Nights:</strong>
                     <span>${nights} ${nights === 1 ? 'night' : 'nights'}</span>
                    </div>
                  <div class="detail-row">
                     <strong>Guests:</strong>
                      <span>${updatedBooking.guests || 1} ${updatedBooking.guests === 1 ? 'guest' : 'guests'}</span>
                  </div>
                   <div class="detail-row">
                      <strong>Total Price:</strong>
                    <span>PKR ${updatedBooking.priceSnapshot?.totalPrice || updatedBooking.totalPrice || 0}</span>
                   </div>
                  </div>
                
                 <p><strong>Hotel Address:</strong><br>${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}</p>
                
                <p>We look forward to hosting you!</p>
                
                  <p>Best regards,<br>The BookSmart Team</p>
              </div>
               <div class="footer">
                  <p>This is an automated email. Please do not reply.</p>
              </div>
             </div>
            </body>
          </html>
         `,
          text: `Booking Confirmed!

Dear ${customer.name || 'Customer'},

✅ Your booking has been confirmed by the hotel!

Booking Information:
- Booking ID: ${bookingId}
- Hotel: ${hotel.name || 'Hotel'}
- Check-in: ${checkIn}
- Check-out: ${checkOut}
- Nights: ${nights} ${nights === 1 ? 'night' : 'nights'}
- Guests: ${updatedBooking.guests || 1} ${updatedBooking.guests === 1 ? 'guest' : 'guests'}
- Total Price: PKR ${updatedBooking.priceSnapshot?.totalPrice || updatedBooking.totalPrice || 0}

Hotel Address: ${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}

We look forward to hosting you!

Best regards,
The BookSmart Team`
        };

       await sendEmail(
          customer.email,
        emailTemplate.subject,
         emailTemplate.html,
          emailTemplate.text
      );

        console.log(`✅ Booking confirmation email sent to customer: ${customer.email}`);
    } catch (error) {
       console.error('❌ Error sending booking confirmation email:', error);
      }
  }
}

module.exports = new OwnerBookingService();
