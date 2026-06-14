const HotelModel = require('../models/hotelModel');
const UserModel = require('../models/userModel');
const BookingModel = require('../models/bookingModel');
const CustomerModel = require('../models/customerModel');
const BaseService = require('./BaseService');
const AdminActivityLogger = require('./AdminActivityLogger');
const { sendEmail, emailTemplates } = require('../utils/emailService');

class AdminHotelService extends BaseService {
  async getHotels({ status, search, page = 1, limit = 50 }) {
     const skip = (page - 1) * limit;
      const query = this._buildHotelQuery(status, search);

     const [hotels, total] = await Promise.all([
        HotelModel.find(query)
        .populate('ownerId', 'name email phone')
         .sort({ createdAt: -1 })
          .limit(parseInt(limit))
        .skip(skip),
       HotelModel.countDocuments(query)
      ]);

     return {
        hotels,
      pagination: {
         total,
          page: parseInt(page),
        limit: parseInt(limit),
         pages: Math.ceil(total / limit)
        }
    };
   }

  async approveHotel(hotelId, adminId) {
     const hotel = await HotelModel.findByIdAndUpdate(
        hotelId,
      {
         isApproved: true,
          isSuspended: false,
        rejectionReason: ''
       },
        { new: true }
    ).populate('ownerId', 'name email');

      if (!hotel) {
      throw new Error('Hotel not found');
     }

    await AdminActivityLogger.log(
       adminId,
        'hotel_approved',
      'hotel',
       hotelId,
        `Approved hotel: ${hotel.name}`,
      { hotelName: hotel.name }
     );

    try {
       if (hotel.ownerId && hotel.ownerId.email) {
          const owner = hotel.ownerId;
        const emailTemplate = emailTemplates.hotelApprovalEmail(hotel, owner);
        
          await sendEmail(
          owner.email,
           emailTemplate.subject,
            emailTemplate.html,
          emailTemplate.text
         );
        
        console.log(`✅ Hotel approval email sent to owner: ${owner.email}`);
       } else {
          console.warn(`⚠️  Could not send approval email - hotel owner email not found for hotel: ${hotel.name}`);
      }
     } catch (emailError) {
        console.error('❌ Error sending hotel approval email:', emailError);
    }

      return hotel;
  }

    async rejectHotel(hotelId, adminId, reason = '') {
    const hotel = await HotelModel.findByIdAndUpdate(
       hotelId,
        {
        isApproved: false,
         isSuspended: true,
          rejectionReason: reason
      },
       { new: true }
      );

     if (!hotel) {
        throw new Error('Hotel not found');
    }

      await AdminActivityLogger.log(
      adminId,
       'hotel_rejected',
        'hotel',
      hotelId,
       `Rejected hotel: ${hotel.name}`,
        { hotelName: hotel.name, reason }
    );

      return hotel;
  }

    async suspendHotel(hotelId, adminId, reason = '') {
    const hotel = await HotelModel.findByIdAndUpdate(
       hotelId,
        {
        isSuspended: true,
         suspensionReason: reason
        },
      { new: true }
     ).populate('ownerId', 'name email');

    if (!hotel) {
       throw new Error('Hotel not found');
      }

     await AdminActivityLogger.log(
        adminId,
      'hotel_suspended',
       'hotel',
        hotelId,
      `Suspended hotel: ${hotel.name}`,
       { hotelName: hotel.name, reason }
      );

     // Send email notification to hotel owner
      try {
      if (hotel.ownerId && hotel.ownerId.email) {
         const owner = hotel.ownerId;
          const emailTemplate = emailTemplates.hotelSuspensionEmail(hotel, owner, reason);
        
         await sendEmail(
            owner.email,
          emailTemplate.subject,
           emailTemplate.html,
            emailTemplate.text
        );
        
          console.log(`✅ Hotel suspension email sent to owner: ${owner.email}`);
      } else {
         console.warn(`⚠️  Could not send suspension email - hotel owner email not found for hotel: ${hotel.name}`);
        }
    } catch (emailError) {
       console.error('❌ Error sending hotel suspension email:', emailError);
        // Don't fail the suspension if email fails
    }

      // Cancel all pending and confirmed bookings for this hotel
    try {
       const bookingsToCancel = await BookingModel.find({
          hotelId: hotelId,
        status: { $in: ['pending', 'confirmed'] }
       }).populate('userId', 'name email').populate('hotelId', 'name location');

      console.log(`Found ${bookingsToCancel.length} bookings to cancel for suspended hotel: ${hotel.name}`);

        for (const booking of bookingsToCancel) {
        try {
           // Update booking status to cancelled
            await BookingModel.findByIdAndUpdate(booking._id, {
            status: 'cancelled',
             cancelledAt: new Date()
            });

           // Send cancellation email to customer
            if (booking.userId && booking.userId.email) {
            const customer = booking.userId;
             const refundAmount = booking.status === 'confirmed' 
                ? (booking.priceSnapshot?.totalPrice || booking.totalPrice || 0)
              : null;

              const emailTemplate = emailTemplates.cancellationEmail(
              booking,
               booking.hotelId || hotel,
                { name: customer.name, email: customer.email },
              refundAmount
             );

            await sendEmail(
               customer.email,
                emailTemplate.subject,
              emailTemplate.html,
               emailTemplate.text
              );

             console.log(`✅ Cancellation email sent to customer: ${customer.email} for booking ${booking._id}`);
            }
        } catch (bookingError) {
           console.error(`❌ Error cancelling booking ${booking._id}:`, bookingError);
            // Continue with other bookings even if one fails
        }
       }

      console.log(`✅ Cancelled ${bookingsToCancel.length} bookings for suspended hotel: ${hotel.name}`);
     } catch (bookingsError) {
        console.error('❌ Error cancelling bookings for suspended hotel:', bookingsError);
      // Don't fail the suspension if booking cancellation fails
     }

    return hotel;
   }

  async unsuspendHotel(hotelId, adminId) {
     const hotel = await HotelModel.findByIdAndUpdate(
        hotelId,
      {
         isSuspended: false,
          suspensionReason: ''
      },
       { new: true }
      );

     if (!hotel) {
        throw new Error('Hotel not found');
    }

      await AdminActivityLogger.log(
      adminId,
       'hotel_unsuspended',
        'hotel',
      hotelId,
       `Unsuspended hotel: ${hotel.name}`,
        { hotelName: hotel.name }
    );

      return hotel;
  }

    async getLowRatedHotels({ page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;

      const [hotels, total] = await Promise.all([
      HotelModel.find({
         rating: { $lt: 2.5 },
          totalReviews: { $gte: 5 }
      })
         .populate('ownerId', 'name email phone')
          .sort({ rating: 1 })
        .limit(parseInt(limit))
         .skip(skip),
        HotelModel.countDocuments({
        rating: { $lt: 2.5 },
         totalReviews: { $gte: 5 }
        })
    ]);

      return {
      hotels,
       pagination: {
          total,
        page: parseInt(page),
         limit: parseInt(limit),
          pages: Math.ceil(total / limit)
      }
     };
    }


    _buildHotelQuery(status, search) {
    const query = {};

      // Filter by status
    if (status === 'pending') {
       query.isApproved = false;
        query.isSuspended = false;
    } else if (status === 'approved') {
       query.isApproved = true;
        query.isSuspended = false;
    } else if (status === 'suspended') {
       query.isSuspended = true;
      } else if (status === 'flagged') {
      query.isFlagged = true;
     }

    // Search functionality
     if (search) {
        query.$or = [
        { name: { $regex: search, $options: 'i' } },
         { description: { $regex: search, $options: 'i' } },
          { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
       ];
      }

     return query;
    }
}

module.exports = new AdminHotelService();

