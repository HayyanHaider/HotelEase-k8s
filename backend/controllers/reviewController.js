const BaseController = require('./BaseController');
const ReviewService = require('../services/ReviewService');

class ReviewController extends BaseController {
  constructor() {
    super();
    this.reviewService = ReviewService;
  }

  createReview = async (req, res) => {
    try {
      const { bookingId, rating, comment } = req.body;
      const userId = req.user.userId;

      if (!bookingId || !rating) {
        return this.fail(res, 400, 'bookingId and rating are required');
      }

      const review = await this.reviewService.createReview({
        bookingId,
        rating,
        comment
      }, userId);

      return this.created(res, {
        review
      });
    } catch (error) {
      console.error('createReview error:', error);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('already exists') || 
                     error.message.includes('only after') ? 400 : 500;
      return this.fail(res, status, error.message || 'Server error while creating review');
    }
  };

  listHotelReviews = async (req, res) => {
    try {
      const { hotelId } = req.params;

      const reviews = await this.reviewService.getHotelReviews(hotelId, {
        populate: { path: 'userId', select: 'email name' }
      });

      const normalizedReviews = reviews.map((review) => {
        const reviewObj = typeof review === 'object' && review.toJSON ? review.toJSON() : review;
        if (!reviewObj.reply && reviewObj.replyText) {
          reviewObj.reply = {
            by: reviewObj.reply?.by || null,
            text: reviewObj.replyText,
            repliedAt: reviewObj.repliedAt
          };
        }
        return reviewObj;
      });

      return this.ok(res, {
        count: normalizedReviews.length,
        reviews: normalizedReviews
      });
    } catch (error) {
      console.error('listHotelReviews error:', error);
      return this.fail(res, 500, error.message || 'Server error while listing reviews');
    }
  };

  replyToReview = async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { text } = req.body;
      const userId = req.user.userId;

      if (!text) {
        return this.fail(res, 400, 'Reply text is required');
      }

      const reviewData = await this.reviewService.reviewRepository.findById(reviewId);
      if (!reviewData) {
        return this.fail(res, 404, 'Review not found');
      }

      const hotel = await this.reviewService.hotelRepository.findById(reviewData.hotelId);
      if (hotel && hotel.isSuspended) {
        return this.fail(res, 403, 'Cannot reply to reviews for a suspended hotel');
      }

      const Review = require('../classes/Review');
      const reviewInstance = new Review(reviewData);
      reviewInstance.addOwnerResponse(text);

      const updatedReview = await this.reviewService.reviewRepository.updateById(reviewId, {
        replyText: reviewInstance.replyText,
        repliedAt: reviewInstance.repliedAt,
        reply: {
          by: userId,
          text: text,
          repliedAt: reviewInstance.repliedAt
        }
      });

      return this.ok(res, {
        review: updatedReview
      });
    } catch (error) {
      console.error('replyToReview error:', error);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('suspended') ? 403 : 500;
      return this.fail(res, status, error.message || 'Server error while replying to review');
    }
  };
}

const reviewController = new ReviewController();

module.exports = {
  createReview: reviewController.createReview,
  listHotelReviews: reviewController.listHotelReviews,
  replyToReview: reviewController.replyToReview
};
