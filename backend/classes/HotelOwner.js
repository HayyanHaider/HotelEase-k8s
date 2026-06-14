const User = require('./User');
const { getHotelOwnerPermissions } = require('./utils/RolePermissions');

class HotelOwner extends User {
   constructor(userData) {
      super(userData);
    this.businessName = userData.businessName || '';
     this.ownedHotels = userData.ownedHotels || [];
      this.commissionRate = userData.commissionRate || 0.10;
    this.totalEarnings = userData.totalEarnings || 0;
     this.monthlyEarnings = userData.monthlyEarnings || 0;
      this.walletBalance = userData.walletBalance || 0;
    this.rating = userData.rating || 0;
     this.totalReviews = userData.totalReviews || 0;
      this.businessLicense = userData.businessLicense || '';
    this.taxId = userData.taxId || '';
     this.bankDetails = userData.bankDetails || {};
    }

   getSpecificCapabilities() {
      return [
      'manage_hotels',
       'add_hotels',
        'update_hotel_info',
      'manage_rooms',
       'view_bookings',
        'respond_to_reviews',
      'view_earnings',
       'manage_availability'
      ];
  }

    hasPermission(permission) {
    if (super.hasPermission(permission)) {
       return true;
      }
    
     return getHotelOwnerPermissions().includes(permission);
    }

   addHotel(hotelId) {
      if (!this.ownedHotels) {
      this.ownedHotels = [];
     }
      if (!this.ownedHotels.includes(hotelId)) {
      this.ownedHotels.push(hotelId);
       this.updatedAt = new Date();
        return true;
    }
     return false;
    }

   removeHotel(hotelId) {
      if (!this.ownedHotels) {
      this.ownedHotels = [];
       return false;
      }
    const index = this.ownedHotels.indexOf(hotelId);
     if (index > -1) {
        this.ownedHotels.splice(index, 1);
      this.updatedAt = new Date();
       return true;
      }
    return false;
   }

  calculateNetEarnings(grossAmount) {
     const commission = grossAmount * this.commissionRate;
      return grossAmount - commission;
  }

    addEarnings(amount) {
    const netAmount = this.calculateNetEarnings(amount);
     this.totalEarnings += netAmount;
      this.monthlyEarnings += netAmount;
    this.walletBalance += netAmount;
     this.updatedAt = new Date();
      return netAmount;
  }

    resetMonthlyEarnings() {
    this.monthlyEarnings = 0;
     this.updatedAt = new Date();
    }

   updateBusinessInfo(businessInfo) {
      const allowedFields = ['businessLicense', 'taxId', 'bankDetails'];
    
     allowedFields.forEach(field => {
        if (businessInfo[field] !== undefined) {
        this[field] = businessInfo[field];
       }
      });
    
     this.updatedAt = new Date();
    }

   updateRating(newRating) {
      const totalRatingPoints = this.rating * this.totalReviews;
    this.totalReviews += 1;
     this.rating = (totalRatingPoints + newRating) / this.totalReviews;
      this.updatedAt = new Date();
  }

    canAddMoreHotels() {
    if (!this.ownedHotels) {
       this.ownedHotels = [];
      }
    const maxHotels = this.isVerified ? 10 : 2;
     return this.ownedHotels.length < maxHotels && !this.isSuspended;
    }

   getBusinessStats() {
      return {
      totalHotels: (this.ownedHotels && this.ownedHotels.length) || 0,
       totalEarnings: this.totalEarnings || 0,
        monthlyEarnings: this.monthlyEarnings || 0,
      averageRating: this.rating || 0,
       totalReviews: this.totalReviews || 0,
        commissionRate: this.commissionRate || 0.10
    };
   }

  calculateCommission(amount) {
     return amount * this.commissionRate;
    }

   isBusinessVerified() {
      return this.businessLicense && this.taxId && this.isVerified;
  }

    withdrawEarnings(amount) {
    if (this.walletBalance >= amount && amount > 0) {
       this.walletBalance -= amount;
        this.updatedAt = new Date();
      return true;
     }
      return false;
  }

    getPayoutInfo() {
    return {
       availableBalance: this.walletBalance,
        totalEarnings: this.totalEarnings,
      monthlyEarnings: this.monthlyEarnings,
       bankDetails: this.bankDetails,
        canWithdraw: this.isBusinessVerified() && this.walletBalance > 0
    };
   }

  getPublicInfo() {
     const baseInfo = super.getPublicInfo();
      return {
      ...baseInfo,
       totalHotels: (this.ownedHotels && this.ownedHotels.length) || 0,
        rating: this.rating || 0,
      totalReviews: this.totalReviews || 0,
       isBusinessVerified: this.isBusinessVerified()
      };
  }
}

module.exports = HotelOwner;
