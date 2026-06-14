const BaseEntity = require('./BaseEntity');

class Review extends BaseEntity {
  constructor(reviewData = {}) {
    super(reviewData);
    this.bookingId = reviewData.bookingId;
    this.hotelId = reviewData.hotelId;
    this.userId = reviewData.userId;
    this.rating = reviewData.rating;
    this.comment = reviewData.comment || '';
    this.replyText = reviewData.replyText || '';
    this.repliedAt = reviewData.repliedAt || null;
  }

  #validateReviewData() {
    const errors = [];
    
    if (!this.bookingId) {
      errors.push('Booking ID is required');
    }
    
    if (!this.userId) {
      errors.push('User ID is required');
    }
    
    if (!this.hotelId) {
      errors.push('Hotel ID is required');
    }
    
    if (!this.rating || this.rating < 1 || this.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }
    
    if (this.comment && this.comment.length > 1000) {
      errors.push('Comment cannot exceed 1000 characters');
    }
    
    return errors;
  }

  validate() {
    return this.#validateReviewData();
  }

  addOwnerResponse(response) {
    this.replyText = response;
    this.repliedAt = new Date();
    this.updatedAt = new Date();
  }

  removeOwnerResponse() {
    this.replyText = '';
    this.repliedAt = null;
    this.updatedAt = new Date();
  }

  updateContent(updates) {
    const allowedFields = ['comment'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });
    
    this.updatedAt = new Date();
  }

  isRecent(days = 30) {
    if (!this.createdAt) return false;
    const daysDiff = (new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24);
    return daysDiff <= days;
  }

  isHighlyRated() {
    return this.rating >= 4;
  }

  isPoorlyRated() {
    return this.rating <= 2;
  }

  hasOwnerResponse() {
    return !!this.replyText && this.replyText.trim().length > 0;
  }

  static calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  static getRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    if (!reviews) return distribution;
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating] += 1;
      }
    });
    
    return distribution;
  }

  static searchByCriteria(reviews, criteria) {
    if (!reviews) return [];
    
    return reviews.filter(review => {
      let matches = true;
      
      if (criteria.userId && review.userId !== criteria.userId) {
        matches = false;
      }
      
      if (criteria.hotelId && review.hotelId !== criteria.hotelId) {
        matches = false;
      }
      
      if (criteria.minRating && review.rating < criteria.minRating) {
        matches = false;
      }
      
      if (criteria.maxRating && review.rating > criteria.maxRating) {
        matches = false;
      }
      
      if (criteria.hasResponse !== undefined) {
        const hasResponse = !!(review.replyText && review.replyText.trim().length > 0);
        if (hasResponse !== criteria.hasResponse) {
          matches = false;
        }
      }
      
      if (criteria.dateFrom && review.createdAt < new Date(criteria.dateFrom)) {
        matches = false;
      }
      
      if (criteria.dateTo && review.createdAt > new Date(criteria.dateTo)) {
        matches = false;
      }
      
      return matches;
    });
  }

  getStats() {
    return {
      rating: this.rating,
      hasOwnerResponse: this.hasOwnerResponse(),
      isRecent: this.isRecent(),
      isHighlyRated: this.isHighlyRated(),
      isPoorlyRated: this.isPoorlyRated()
    };
  }

  getPublicInfo() {
    return {
      id: this.id,
      _id: this.id,
      rating: this.rating,
      comment: this.comment,
      replyText: this.replyText,
      repliedAt: this.repliedAt,
      hasOwnerResponse: this.hasOwnerResponse(),
      createdAt: this.createdAt,
      userId: this.userId,
      customer: this.userId
    };
  }

  getDetailedInfo() {
    return {
      ...this.getPublicInfo(),
      bookingId: this.bookingId,
      userId: this.userId,
      hotelId: this.hotelId,
      updatedAt: this.updatedAt
    };
  }

  getSummary() {
    return {
      reviewId: this.id,
      rating: this.rating,
      hasResponse: this.hasOwnerResponse(),
      reviewDate: this.createdAt ? new Date(this.createdAt).toDateString() : ''
    };
  }
}

module.exports = Review;
