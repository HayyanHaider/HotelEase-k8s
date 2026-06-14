const HotelModel = require('../models/hotelModel');
const AdminActivityLogger = require('../services/AdminActivityLogger');

// Auto-flag hotels with rating < 2.5 stars
const MIN_RATING_THRESHOLD = 2.5;

const autoFlagLowRatedHotels = async () => {
   try {
      // Find hotels with rating < 2.5 and not already flagged
    const lowRatedHotels = await HotelModel.find({
       isApproved: true,
        isSuspended: false,
      $or: [
         { ratingAvg: { $lt: MIN_RATING_THRESHOLD } },
          { rating: { $lt: MIN_RATING_THRESHOLD } }
      ],
       $and: [
          {
          $or: [
             { flaggedForLowRating: { $exists: false } },
              { flaggedForLowRating: false }
          ]
         }
        ]
    }).populate('ownerId');

      console.log(`Found ${lowRatedHotels.length} hotels to flag for low ratings`);

     for (const hotel of lowRatedHotels) {
        try {
        // Flag the hotel
         await HotelModel.findByIdAndUpdate(hotel._id, {
            isFlagged: true,
          flaggedForLowRating: true,
           flaggedAt: new Date(),
            flaggedReason: `Hotel rating (${hotel.ratingAvg?.toFixed(1) || hotel.rating?.toFixed(1) || 0}) is below ${MIN_RATING_THRESHOLD} stars`
        });

          // Log admin activity
        const admins = await require('../models/userModel').find({ role: 'admin' });
         if (admins.length > 0) {
            AdminActivityLogger.log(
            admins[0]._id,
             'auto_flag_hotel',
              'hotel',
            hotel._id.toString(),
             `Auto-flagged hotel "${hotel.name}" for low rating (${(hotel.ratingAvg || hotel.rating || 0).toFixed(1)} stars)`,
              {
              hotelId: hotel._id,
               hotelName: hotel.name,
                rating: hotel.ratingAvg || hotel.rating || 0,
              reason: 'Low rating'
             }
            ).catch(err => {
            console.error('Error logging admin activity:', err);
           });
          }

         console.log(`Flagged hotel ${hotel._id} (${hotel.name}) for low rating`);
        } catch (hotelError) {
        console.error(`Error flagging hotel ${hotel._id}:`, hotelError);
       }
      }
  } catch (error) {
     console.error('Error in auto-flag service:', error);
    }
};

// Run auto-flag check daily
const startAutoFlagService = () => {
   // Run immediately on startup
    autoFlagLowRatedHotels();
  
   // Then run daily (every 24 hours)
    setInterval(autoFlagLowRatedHotels, 24 * 60 * 60 * 1000);
  
   console.log('Auto-flag service started (runs daily)');
};

module.exports = {
    autoFlagLowRatedHotels,
  startAutoFlagService
};

