const BaseEntity = require('./BaseEntity');

class Booking extends BaseEntity {
  constructor(bookingData = {}) {
     super(bookingData);
      this.hotelId = bookingData.hotelId;
    this.userId = bookingData.userId;
     this.paymentId = bookingData.paymentId || null;
      this.couponId = bookingData.couponId || null;
    this.checkIn = bookingData.checkIn;
     this.checkOut = bookingData.checkOut;
      this.nights = bookingData.nights;
    this.guests = bookingData.guests;
     this.taxes = bookingData.taxes || 0;
      this.discounts = bookingData.discounts || 0;
    this.totalPrice = bookingData.totalPrice;
     this.status = bookingData.status;
      this.confirmedAt = bookingData.confirmedAt || null;
    this.cancelledAt = bookingData.cancelledAt || null;
     this.priceSnapshot = bookingData.priceSnapshot || {};
      this.invoicePath = bookingData.invoicePath || '';
    this.autoConfirmedAt = bookingData.autoConfirmedAt || null;
   }

  #validateBookingData() {
     const errors = [];
    
    if (!this.userId) {
       errors.push('User ID is required');
      }
    
     if (!this.hotelId) {
        errors.push('Hotel ID is required');
    }
    
      if (!this.checkIn || !this.checkOut) {
      errors.push('Check-in and check-out dates are required');
     }
    
    if (this.checkIn && this.checkOut && new Date(this.checkIn) >= new Date(this.checkOut)) {
       errors.push('Check-out date must be after check-in date');
      }
    
     if (!this.guests || this.guests <= 0) {
        errors.push('Guest count must be greater than 0');
    }
    
      if (!this.totalPrice || this.totalPrice <= 0) {
      errors.push('Valid total price is required');
     }
    
    return errors;
   }

  validate() {
     return this.#validateBookingData();
    }

   getNights() {
      if (!this.checkIn || !this.checkOut) {
      return 0;
     }
      const checkInDate = new Date(this.checkIn);
    const checkOutDate = new Date(this.checkOut);
     return Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    }

   isActive() {
      return this.status === 'confirmed' && this.paymentId;
  }

    canBeCancelled() {
    if (this.status !== 'confirmed' && this.status !== 'pending') {
       return false;
      }
    
     const now = new Date();
      const checkInDate = new Date(this.checkIn);
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
    
      return hoursUntilCheckIn > 24;
  }

    confirm() {
    if (this.status !== 'pending') {
       throw new Error('Only pending bookings can be confirmed');
      }
    
     this.status = 'confirmed';
      this.confirmedAt = new Date();
    this.updatedAt = new Date();
   }

  cancel(reason = '') {
     if (!this.canBeCancelled()) {
        throw new Error('Booking cannot be cancelled');
    }
    
      this.status = 'cancelled';
    this.cancelledAt = new Date();
     this.updatedAt = new Date();
    }

   isPast() {
      const now = new Date();
    const checkOutDate = new Date(this.checkOut);
     return checkOutDate < now;
    }

   isCurrent() {
      const now = new Date();
    const checkInDate = new Date(this.checkIn);
     const checkOutDate = new Date(this.checkOut);
      return checkInDate <= now && now < checkOutDate && this.status === 'confirmed';
  }

    isUpcoming() {
    const now = new Date();
     const checkInDate = new Date(this.checkIn);
      return checkInDate > now && this.status === 'confirmed';
  }

    getDuration() {
    return this.getNights();
   }

  getPublicInfo() {
     return {
        id: this.id,
      hotelId: this.hotelId,
       checkIn: this.checkIn,
        checkOut: this.checkOut,
      guests: this.guests,
       totalPrice: this.totalPrice,
        status: this.status,
      nights: this.getNights(),
       createdAt: this.createdAt
      };
  }

    getDetailedInfo() {
    return {
       ...this.getPublicInfo(),
        userId: this.userId,
      paymentId: this.paymentId,
       couponId: this.couponId,
        taxes: this.taxes,
      discounts: this.discounts,
       priceSnapshot: this.priceSnapshot,
        confirmedAt: this.confirmedAt,
      cancelledAt: this.cancelledAt,
       invoicePath: this.invoicePath,
        autoConfirmedAt: this.autoConfirmedAt,
      updatedAt: this.updatedAt
     };
    }

   getConfirmationDetails() {
      return {
      bookingId: this.id,
       checkIn: new Date(this.checkIn).toDateString(),
        checkOut: new Date(this.checkOut).toDateString(),
      nights: this.getNights(),
       guests: this.guests,
        totalPrice: this.totalPrice,
      status: this.status
     };
    }

   static searchByCriteria(bookings, criteria) {
      return bookings.filter(booking => {
      let matches = true;
      
        if (criteria.userId && booking.userId !== criteria.userId) {
        matches = false;
       }
      
      if (criteria.hotelId && booking.hotelId !== criteria.hotelId) {
         matches = false;
        }
      
       if (criteria.status && booking.status !== criteria.status) {
          matches = false;
      }
      
        if (criteria.dateFrom && booking.checkIn < new Date(criteria.dateFrom)) {
        matches = false;
       }
      
      if (criteria.dateTo && booking.checkOut > new Date(criteria.dateTo)) {
         matches = false;
        }
      
       return matches;
      });
  }

    getStats() {
    return {
       nights: this.getNights(),
        totalPrice: this.totalPrice,
      guests: this.guests,
       status: this.status,
        isActive: this.isActive(),
      canBeCancelled: this.canBeCancelled(),
       isPast: this.isPast(),
        isCurrent: this.isCurrent(),
      isUpcoming: this.isUpcoming()
     };
    }
}

module.exports = Booking;
