class IReviewService {
   async createReview(reviewData, userId) {
      throw new Error('createReview method must be implemented');
  }

    async getHotelReviews(hotelId, options = {}) {
    throw new Error('getHotelReviews method must be implemented');
   }

  async getReviewById(reviewId) {
     throw new Error('getReviewById method must be implemented');
    }
}

module.exports = IReviewService;

