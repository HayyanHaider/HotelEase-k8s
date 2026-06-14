const BaseRepository = require('./BaseRepository');
const ReviewModel = require('../models/reviewsModel');

class ReviewRepository extends BaseRepository {
   constructor() {
      super(ReviewModel);
  }

    async findByHotel(hotelId, options = {}) {
    return this.find({ hotelId }, options);
   }

  async findByUser(userId, options = {}) {
     return this.find({ userId }, options);
    }

   async findByBooking(bookingId) {
      return this.findOne({ bookingId });
  }

    async getHotelRatingStats(hotelId) {
    try {
       const stats = await this.model.aggregate([
          { $match: { hotelId: this.model.db.base.model('Review').schema.paths.hotelId.caster ? hotelId : hotelId } },
        { $group: { 
           _id: '$hotelId', 
            avg: { $avg: '$rating' }, 
          count: { $sum: 1 },
           min: { $min: '$rating' },
            max: { $max: '$rating' }
        }}
       ]);

      if (stats.length > 0) {
         return {
            average: stats[0].avg,
          count: stats[0].count,
           min: stats[0].min,
            max: stats[0].max
        };
       }

      return {
         average: 0,
          count: 0,
        min: 0,
         max: 0
        };
    } catch (error) {
       const reviews = await this.findByHotel(hotelId);
        if (reviews.length === 0) {
        return { average: 0, count: 0, min: 0, max: 0 };
       }

      const ratings = reviews.map(r => r.rating);
       return {
          average: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        count: ratings.length,
         min: Math.min(...ratings),
          max: Math.max(...ratings)
      };
     }
    }
}

module.exports = new ReviewRepository();

