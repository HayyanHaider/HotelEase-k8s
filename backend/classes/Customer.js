const User = require('./User');
const { getCustomerPermissions } = require('./utils/RolePermissions');

class Customer extends User {
   constructor(userData) {
      super(userData);
    this.loyaltyPoints = userData.loyaltyPoints || 0;
     this.bookingHistory = userData.bookingHistory || [];
      this.reviewsGiven = userData.reviewsGiven || [];
  }

    getSpecificCapabilities() {
    return [
       'book_rooms',
        'cancel_bookings',
      'write_reviews',
       'add_favorites',
        'view_booking_history',
      'earn_loyalty_points'
     ];
    }

   hasPermission(permission) {
      if (super.hasPermission(permission)) {
      return true;
     }
    
    return getCustomerPermissions().includes(permission);
   }

  addToFavorites(hotelId) {
     if (!this.favorites.includes(hotelId)) {
        this.favorites.push(hotelId);
      this.updatedAt = new Date();
       return true;
      }
    return false;
   }

  removeFromFavorites(hotelId) {
     const index = this.favorites.indexOf(hotelId);
      if (index > -1) {
      this.favorites.splice(index, 1);
       this.updatedAt = new Date();
        return true;
    }
     return false;
    }

   isFavorite(hotelId) {
      return this.favorites.includes(hotelId);
  }

    addBookingToHistory(bookingId) {
    if (!this.bookingHistory) {
       this.bookingHistory = [];
      }
    if (!this.bookingHistory.includes(bookingId)) {
       this.bookingHistory.push(bookingId);
        this.updatedAt = new Date();
    }
   }

  addReview(reviewId) {
     if (!this.reviewsGiven) {
        this.reviewsGiven = [];
    }
     if (!this.reviewsGiven.includes(reviewId)) {
        this.reviewsGiven.push(reviewId);
      this.earnLoyaltyPoints(10);
       this.updatedAt = new Date();
      }
  }

    earnLoyaltyPoints(points) {
    this.loyaltyPoints += points;
     this.updatedAt = new Date();
    }

   redeemLoyaltyPoints(points) {
      if (this.loyaltyPoints >= points) {
      this.loyaltyPoints -= points;
       this.updatedAt = new Date();
        return true;
    }
     return false;
    }

   getBookingStats() {
      return {
      totalBookings: (this.bookingHistory && this.bookingHistory.length) || 0,
       totalReviews: (this.reviewsGiven && this.reviewsGiven.length) || 0,
        loyaltyPoints: this.loyaltyPoints || 0,
      favoriteCount: (this.favorites && this.favorites.length) || 0
     };
    }

   canBook() {
      return this.isVerified && !this.isSuspended;
  }

    calculateLoyaltyDiscount() {
    if (this.loyaltyPoints >= 1000) return 0.15;
     if (this.loyaltyPoints >= 500) return 0.10;
      if (this.loyaltyPoints >= 200) return 0.05;
    return 0;
   }

  getPublicInfo() {
     const baseInfo = super.getPublicInfo();
      return {
      ...baseInfo,
       loyaltyPoints: this.loyaltyPoints || 0,
        favoriteCount: (this.favorites && this.favorites.length) || 0,
      totalBookings: (this.bookingHistory && this.bookingHistory.length) || 0,
       totalReviews: (this.reviewsGiven && this.reviewsGiven.length) || 0
      };
  }
}

module.exports = Customer;
