const BaseEntity = require('./BaseEntity');

class Hotel extends BaseEntity {
  constructor(hotelData = {}) {
     super(hotelData);
      this.name = hotelData.name;
    this.description = hotelData.description || '';
     this.amenities = hotelData.amenities || [];
      this.policies = hotelData.policies || {};
    this.isApproved = hotelData.isApproved || false;
     this.isSuspended = hotelData.isSuspended || false;
      this.suspensionReason = hotelData.suspensionReason || '';
    this.rejectionReason = hotelData.rejectionReason || '';
     this.rating = hotelData.rating || 0;
      this.ratingAvg = hotelData.ratingAvg || 0;
    this.totalReviews = hotelData.totalReviews || 0;
     this.isFlagged = hotelData.isFlagged || false;
      this.flaggedReason = hotelData.flaggedReason || '';
    this.flaggedForLowRating = hotelData.flaggedForLowRating || false;
     this.flaggedAt = hotelData.flaggedAt || null;
      this.ownerId = hotelData.ownerId;
    this.location = hotelData.location || {};
     this.pricing = hotelData.pricing || {};
      this.images = hotelData.images || [];
    this.capacity = hotelData.capacity || {};
     this.totalRooms = hotelData.totalRooms || 1;
      this.commissionRate = hotelData.commissionRate || 0.10;
  }

    #validateHotelData() {
    const errors = [];
    
      if (!this.name || this.name.trim().length === 0) {
      errors.push('Hotel name is required');
     }
    
    if (!this.location || !this.location.address || this.location.address.trim().length === 0) {
       errors.push('Hotel address is required');
      }
    
     if (!this.location || !this.location.city || this.location.city.trim().length === 0) {
        errors.push('City is required');
    }
    
      if (!this.ownerId) {
      errors.push('Owner ID is required');
     }
    
    if (!this.totalRooms || this.totalRooms <= 0) {
       errors.push('Total rooms must be at least 1');
      }
    
     return errors;
    }

   validate() {
      return this.#validateHotelData();
  }

    addAmenity(amenity) {
    if (!this.amenities) {
       this.amenities = [];
      }
    if (!this.amenities.includes(amenity)) {
       this.amenities.push(amenity);
        this.updatedAt = new Date();
    }
   }

  removeAmenity(amenity) {
     if (!this.amenities) {
        this.amenities = [];
      return;
     }
      const index = this.amenities.indexOf(amenity);
    if (index > -1) {
       this.amenities.splice(index, 1);
        this.updatedAt = new Date();
    }
   }

  addImage(imageUrl) {
     if (!this.images) {
        this.images = [];
    }
     if (!this.images.includes(imageUrl)) {
        this.images.push(imageUrl);
      this.updatedAt = new Date();
     }
    }

   removeImage(imageUrl) {
      if (!this.images) {
      this.images = [];
       return;
      }
    const index = this.images.indexOf(imageUrl);
     if (index > -1) {
        this.images.splice(index, 1);
      this.updatedAt = new Date();
     }
    }

   updateRating(newRating) {
      if (!this.totalReviews) {
      this.totalReviews = 0;
     }
      if (!this.ratingAvg) {
      this.ratingAvg = 0;
     }
    
    const totalRatingPoints = this.ratingAvg * this.totalReviews;
     this.totalReviews += 1;
      this.ratingAvg = (totalRatingPoints + newRating) / this.totalReviews;
    this.rating = this.ratingAvg;
     this.updatedAt = new Date();
    }

   updateInfo(updates) {
      const allowedFields = [
      'name', 'description', 'location', 'amenities', 
       'policies', 'pricing', 'images', 'capacity', 'totalRooms'
      ];
    
     allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
        this[field] = updates[field];
       }
      });
    
     this.updatedAt = new Date();
    }

   approve() {
      this.isApproved = true;
    this.rejectionReason = '';
     this.updatedAt = new Date();
    }

   reject(reason = '') {
      this.isApproved = false;
    this.rejectionReason = reason;
     this.updatedAt = new Date();
    }

   suspend(reason = '') {
      this.isSuspended = true;
    this.suspensionReason = reason;
     this.updatedAt = new Date();
    }

   unsuspend() {
      this.isSuspended = false;
    this.suspensionReason = '';
     this.updatedAt = new Date();
    }

   flag(reason = '', forLowRating = false) {
      this.isFlagged = true;
    this.flaggedReason = reason;
     this.flaggedForLowRating = forLowRating;
      this.flaggedAt = new Date();
    this.updatedAt = new Date();
   }

  unflag() {
     this.isFlagged = false;
      this.flaggedReason = '';
    this.flaggedForLowRating = false;
     this.flaggedAt = null;
      this.updatedAt = new Date();
  }

    isBookable() {
    const bookable = this.isApproved && !this.isSuspended && !this.isFlagged;
     if (!bookable) {
        console.log(`[Hotel.isBookable] Hotel "${this.name}" not bookable - isApproved: ${this.isApproved}, isSuspended: ${this.isSuspended}, isFlagged: ${this.isFlagged}`);
    }
     return bookable;
    }

   getStats() {
      return {
      rating: this.ratingAvg || this.rating || 0,
       totalReviews: this.totalReviews || 0,
        isApproved: this.isApproved,
      isSuspended: this.isSuspended,
       isFlagged: this.isFlagged,
        totalRooms: this.totalRooms || 1,
      capacity: this.capacity || {}
     };
    }

   calculateDistance(lat, lng) {
      if (!this.location || !this.location.coordinates || 
        !this.location.coordinates.lat || !this.location.coordinates.lng) {
       return null;
      }
    
     const R = 6371;
      const dLat = this.#toRadians(lat - this.location.coordinates.lat);
    const dLng = this.#toRadians(lng - this.location.coordinates.lng);
    
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.#toRadians(this.location.coordinates.lat)) * 
               Math.cos(this.#toRadians(lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
  }

    #toRadians(degrees) {
    return degrees * (Math.PI / 180);
   }

  static searchByCriteria(hotels, criteria) {
     if (!hotels) return [];
    
    return hotels.filter(hotel => {
       let matches = true;
      
      if (criteria.city && hotel.location && 
           hotel.location.city.toLowerCase() !== criteria.city.toLowerCase()) {
          matches = false;
      }
      
        if (criteria.minRating && (hotel.ratingAvg || hotel.rating || 0) < criteria.minRating) {
        matches = false;
       }
      
      if (criteria.maxPrice && hotel.pricing && 
           hotel.pricing.basePrice > criteria.maxPrice) {
          matches = false;
      }
      
        if (criteria.minPrice && hotel.pricing && 
          hotel.pricing.basePrice < criteria.minPrice) {
         matches = false;
        }
      
       if (criteria.amenities && criteria.amenities.length > 0) {
          const hasAllAmenities = criteria.amenities.every(amenity => 
          hotel.amenities && hotel.amenities.includes(amenity)
         );
          if (!hasAllAmenities) {
          matches = false;
         }
        }
      
       return matches && hotel.isBookable();
      });
  }

    getPublicInfo() {
    const idString = this.id ? (this.id.toString ? this.id.toString() : String(this.id)) : null;
     return {
        id: idString,
      name: this.name,
       description: this.description,
        location: this.location || {},
      images: this.images || [],
       amenities: this.amenities || [],
        rating: this.ratingAvg || this.rating || 0,
      totalReviews: this.totalReviews || 0,
       pricing: this.pricing || {},
        capacity: this.capacity || {},
      totalRooms: this.totalRooms || 1,
       isApproved: this.isApproved,
        isSuspended: this.isSuspended
    };
   }

  getDetailedInfo() {
     const ownerIdString = this.ownerId ? (this.ownerId.toString ? this.ownerId.toString() : (this.ownerId._id ? this.ownerId._id.toString() : String(this.ownerId))) : null;
      return {
      ...this.getPublicInfo(),
       ownerId: ownerIdString,
        policies: this.policies,
      isFlagged: this.isFlagged,
       flaggedReason: this.flaggedReason,
        flaggedForLowRating: this.flaggedForLowRating,
      flaggedAt: this.flaggedAt,
       suspensionReason: this.suspensionReason,
        rejectionReason: this.rejectionReason,
      commissionRate: this.commissionRate,
       createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
   }

  hasAvailableCapacity(guests) {
     if (!this.isApproved || this.isSuspended) {
        console.log(`[Hotel.hasAvailableCapacity] Hotel "${this.name}" not available - isApproved: ${this.isApproved}, isSuspended: ${this.isSuspended}`);
      return false;
     }

    const requestedGuests = parseInt(guests) || 1;
     if (requestedGuests < 1) {
        return false;
    }

      const capacityObj = this.capacity && typeof this.capacity.toObject === 'function' 
      ? this.capacity.toObject() 
       : this.capacity;
    
    if (capacityObj && (capacityObj.guests !== undefined && capacityObj.guests !== null)) {
       const hotelCapacity = parseInt(capacityObj.guests);
      
      if (!isNaN(hotelCapacity) && hotelCapacity > 0) {
         const hasCapacity = hotelCapacity >= requestedGuests;
          console.log(`[Hotel.hasAvailableCapacity] Hotel "${this.name}" - capacity: ${hotelCapacity}, requested: ${requestedGuests}, hasCapacity: ${hasCapacity}`);
        return hasCapacity;
       }
      }

     if (requestedGuests <= 10) {
        console.log(`[Hotel.hasAvailableCapacity] Hotel "${this.name}" - no capacity set, showing for ${requestedGuests} guests (lenient mode)`);
      return true;
     }
    
    console.log(`[Hotel.hasAvailableCapacity] Hotel "${this.name}" - no capacity set, requested ${requestedGuests} guests (too many, requiring capacity)`);
     return false;
    }

   hasAvailableRooms(checkIn, checkOut, guests) {
      console.log(`[Hotel.hasAvailableRooms] Checking "${this.name}" - CheckIn: ${checkIn}, CheckOut: ${checkOut}, Guests: ${guests}`);
      
      if (!this.isBookable()) {
      console.log(`[Hotel.hasAvailableRooms] "${this.name}" is not bookable`);
        return false;
     }

    if (this.capacity && this.capacity.guests) {
       if (this.capacity.guests < guests) {
          console.log(`[Hotel.hasAvailableRooms] "${this.name}" - Not enough capacity (has: ${this.capacity.guests}, needs: ${guests})`);
          return false;
      }
     }

    if (this.totalRooms && this.totalRooms <= 0) {
       console.log(`[Hotel.hasAvailableRooms] "${this.name}" - No rooms available (totalRooms: ${this.totalRooms})`);
        return false;
      }

     if (!checkIn || !checkOut) {
        console.log(`[Hotel.hasAvailableRooms] "${this.name}" - Missing dates (checkIn: ${checkIn}, checkOut: ${checkOut})`);
        return false;
    }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        console.log(`[Hotel.hasAvailableRooms] "${this.name}" - Invalid date format`);
        return false;
      }

      if (checkInDate >= checkOutDate) {
      console.log(`[Hotel.hasAvailableRooms] "${this.name}" - CheckIn must be before CheckOut`);
        return false;
     }

    console.log(`[Hotel.hasAvailableRooms] "${this.name}" - All checks passed ✓`);
      return true;
   }

  getPriceRange() {
     const basePrice = this.pricing?.basePrice || 0;
      const cleaningFee = this.pricing?.cleaningFee || 0;
    const serviceFee = this.pricing?.serviceFee || 0;
    
      return {
      min: basePrice,
       max: basePrice + cleaningFee + serviceFee
      };
  }

    getSearchResult() {
    try {
       let idString = null;
        if (this.id) {
        if (typeof this.id === 'object' && this.id.toString) {
           idString = this.id.toString();
          } else if (this._id && typeof this._id === 'object' && this._id.toString) {
          idString = this._id.toString();
         } else {
            idString = String(this.id || this._id || '');
        }
       } else if (this._id) {
          if (typeof this._id === 'object' && this._id.toString) {
          idString = this._id.toString();
         } else {
            idString = String(this._id);
        }
       }

      return {
         id: idString,
          _id: idString,
        name: this.name || '',
         description: this.description || '',
          location: this.location || {},
        images: Array.isArray(this.images) ? this.images : [],
         amenities: Array.isArray(this.amenities) ? this.amenities : [],
          rating: this.ratingAvg || this.rating || 0,
        ratingAvg: this.ratingAvg || this.rating || 0,
         totalReviews: this.totalReviews || 0,
          pricing: this.pricing || {},
        capacity: this.capacity || {},
         totalRooms: this.totalRooms || 1,
          isApproved: this.isApproved || false,
        isSuspended: this.isSuspended || false,
         createdAt: this.createdAt,
          updatedAt: this.updatedAt
      };
     } catch (error) {
        console.error('[Hotel.getSearchResult] Error:', error);
      console.error('[Hotel.getSearchResult] Hotel data:', {
         id: this.id,
          _id: this._id,
        name: this.name
       });
        throw error;
    }
   }

  getBasicInfo() {
     return this.getPublicInfo();
    }
}

module.exports = Hotel;
