import BaseApiService from './BaseApiService';

class ReviewApiService extends BaseApiService {
 async createReview(reviewData) {
  return this.post('/reviews', reviewData);
 }

  async getHotelReviews(hotelId) {
   return this.get(`/reviews/hotel/${hotelId}`);
  }

 async replyToReview(reviewId, text) {
  return this.put(`/reviews/${reviewId}/reply`, { text });
 }
}

export default new ReviewApiService();
