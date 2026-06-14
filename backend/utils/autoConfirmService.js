const BookingModel = require('../models/bookingModel');
const UserModel = require('../models/userModel');
const { sendEmail, emailTemplates } = require('../utils/emailService');

const AUTO_CONFIRM_HOURS = 24;

const autoConfirmBookings = async () => {
   try {
      const autoConfirmTime = new Date();
    autoConfirmTime.setHours(autoConfirmTime.getHours() - AUTO_CONFIRM_HOURS);

      const pendingBookings = await BookingModel.find({
      status: 'pending',
       createdAt: { $lte: autoConfirmTime },
        autoConfirmedAt: null
    })
       .populate('hotelId', 'name location ownerId')
        .populate('userId');

     console.log(`Found ${pendingBookings.length} bookings to auto-confirm`);

    for (const booking of pendingBookings) {
       try {
          await BookingModel.findByIdAndUpdate(booking._id, {
          status: 'confirmed',
           confirmedAt: new Date(),
            autoConfirmedAt: new Date()
        });

          try {
          if (booking.userId && booking.userId.email) {
             const customer = booking.userId;
              const updatedBooking = await BookingModel.findById(booking._id)
              .populate('hotelId', 'name location address')
               .populate('couponId', 'code discountPercentage');

            const checkIn = new Date(updatedBooking.checkIn).toLocaleDateString();
             const checkOut = new Date(updatedBooking.checkOut).toLocaleDateString();
              const nights = updatedBooking.nights || 1;

             const emailTemplate = {
                subject: `Booking Confirmed - ${updatedBooking.hotelId?.name || 'Hotel'} (${booking._id})`,
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
                       <p style="margin: 10px 0 0 0; font-size: 16px;">Your reservation has been automatically confirmed</p>
                      </div>
                    <div class="content">
                       <p>Dear ${customer.name || 'Customer'},</p>
                        <p style="font-size: 16px; color: #28a745; font-weight: bold;">✅ Your booking has been automatically confirmed!</p>
                      <p>We're excited to host you! Please find your booking details below:</p>
                      
                        <div class="booking-details">
                        <h2>Booking Information</h2>
                         <div class="detail-row">
                            <strong>Booking ID:</strong>
                          <span>${booking._id}</span>
                         </div>
                          <div class="detail-row">
                          <strong>Hotel:</strong>
                           <span>${updatedBooking.hotelId?.name || 'Hotel'}</span>
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
                      
                       <p><strong>Hotel Address:</strong><br>${updatedBooking.hotelId?.location?.address || ''}, ${updatedBooking.hotelId?.location?.city || ''}, ${updatedBooking.hotelId?.location?.country || ''}</p>
                      
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

✅ Your booking has been automatically confirmed!

Booking Information:
- Booking ID: ${booking._id}
- Hotel: ${updatedBooking.hotelId?.name || 'Hotel'}
- Check-in: ${checkIn}
- Check-out: ${checkOut}
- Nights: ${nights} ${nights === 1 ? 'night' : 'nights'}
- Guests: ${updatedBooking.guests || 1} ${updatedBooking.guests === 1 ? 'guest' : 'guests'}
- Total Price: PKR ${updatedBooking.priceSnapshot?.totalPrice || updatedBooking.totalPrice || 0}

Hotel Address: ${updatedBooking.hotelId?.location?.address || ''}, ${updatedBooking.hotelId?.location?.city || ''}, ${updatedBooking.hotelId?.location?.country || ''}

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

              console.log(`✅ Auto-confirmation email sent to customer: ${customer.email} for booking ${booking._id}`);
          }
         } catch (emailError) {
            console.error(`❌ Error sending auto-confirmation email for booking ${booking._id}:`, emailError);
        }

          console.log(`Auto-confirmed booking ${booking._id}`);
      } catch (bookingError) {
         console.error(`Error auto-confirming booking ${booking._id}:`, bookingError);
        }
    }
   } catch (error) {
      console.error('Error in auto-confirm service:', error);
  }
};

const startAutoConfirmService = () => {
   autoConfirmBookings();
  
  setInterval(autoConfirmBookings, 60 * 60 * 1000);
  
    console.log('Auto-confirm service started (runs every hour)');
};

module.exports = {
  autoConfirmBookings,
   startAutoConfirmService
};

