const BaseEntity = require('./BaseEntity');

class Room extends BaseEntity {
  constructor(roomData = {}) {
     super(roomData);
      this.hotelId = roomData.hotelId;
    this.name = roomData.name;
     this.type = roomData.type;
      this.description = roomData.description || '';
    this.pricePerNight = roomData.pricePerNight;
     this.capacity = roomData.capacity;
      this.totalRooms = roomData.totalRooms || 1;
    this.availableRooms = roomData.availableRooms || 1;
     this.amenities = roomData.amenities || [];
      this.images = roomData.images || [];
    this.isAvailable = roomData.isAvailable !== undefined ? roomData.isAvailable : true;
     this.isActive = roomData.isActive !== undefined ? roomData.isActive : true;
    }

   // Encapsulation: Private method to validate room data
    #validateRoomData() {
    const errors = [];
    
      if (!this.hotelId) {
      errors.push('Hotel ID is required');
     }
    
    if (!this.name || this.name.trim().length === 0) {
       errors.push('Room name is required');
      }
    
     if (!this.type || this.type.trim().length === 0) {
        errors.push('Room type is required');
    }
    
      if (!this.pricePerNight || this.pricePerNight <= 0) {
      errors.push('Valid price per night is required');
     }
    
    if (!this.capacity || this.capacity <= 0) {
       errors.push('Valid capacity is required');
      }
    
     if (this.totalRooms && this.totalRooms < 1) {
        errors.push('Total rooms must be at least 1');
    }
    
      if (this.availableRooms && this.availableRooms < 0) {
      errors.push('Available rooms cannot be negative');
     }
    
    return errors;
   }

  // Method to validate room information
   validate() {
      return this.#validateRoomData();
  }

    // Method to check if room is available for booking
  isAvailableForBooking() {
     return this.isAvailable && this.isActive && this.availableRooms > 0;
    }

   // Method to calculate total price for stay
    calculateTotalPrice(checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
     const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
     if (nights <= 0) {
        throw new Error('Invalid date range');
    }

      const totalPrice = this.pricePerNight * nights;
    
     return {
        basePrice: this.pricePerNight * nights,
      totalPrice: totalPrice,
       nights: nights,
        pricePerNight: this.pricePerNight
    };
   }

  // Method to update room information
   updateInfo(updates) {
      const allowedFields = [
      'name', 'type', 'description', 'capacity', 'pricePerNight',
       'totalRooms', 'availableRooms', 'images', 'amenities'
      ];
    
     allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
        this[field] = updates[field];
       }
      });
    
     this.updatedAt = new Date();
    }

   // Method to activate room
    activate() {
    this.isActive = true;
     this.updatedAt = new Date();
    }

   // Method to deactivate room
    deactivate() {
    this.isActive = false;
     this.updatedAt = new Date();
    }

   // Method to set availability
    setAvailability(available) {
    this.isAvailable = available;
     this.updatedAt = new Date();
    }

   // Method to update available rooms count
    updateAvailableRooms(count) {
    if (count < 0 || count > this.totalRooms) {
       throw new Error('Available rooms count must be between 0 and total rooms');
      }
    this.availableRooms = count;
     this.updatedAt = new Date();
    }

   // Method to add amenity
    addAmenity(amenity) {
    if (!this.amenities.includes(amenity)) {
       this.amenities.push(amenity);
        this.updatedAt = new Date();
    }
   }

  // Method to remove amenity
   removeAmenity(amenity) {
      const index = this.amenities.indexOf(amenity);
    if (index > -1) {
       this.amenities.splice(index, 1);
        this.updatedAt = new Date();
    }
   }

  // Method to add image
   addImage(imageUrl) {
      if (!this.images) {
      this.images = [];
     }
      if (!this.images.includes(imageUrl)) {
      this.images.push(imageUrl);
       this.updatedAt = new Date();
      }
  }

    // Method to remove image
  removeImage(imageUrl) {
     const index = this.images.indexOf(imageUrl);
      if (index > -1) {
      this.images.splice(index, 1);
       this.updatedAt = new Date();
      }
  }

    // Static method to search rooms by criteria
  static searchByCriteria(rooms, criteria) {
     return rooms.filter(room => {
        let matches = true;
      
       if (criteria.hotelId && room.hotelId !== criteria.hotelId) {
          matches = false;
      }
      
        if (criteria.type && room.type !== criteria.type) {
        matches = false;
       }
      
      if (criteria.maxPrice && room.pricePerNight > criteria.maxPrice) {
         matches = false;
        }
      
       if (criteria.minCapacity && room.capacity < criteria.minCapacity) {
          matches = false;
      }
      
        if (criteria.amenities && criteria.amenities.length > 0) {
        const hasAllAmenities = criteria.amenities.every(amenity => 
           room.amenities.includes(amenity)
          );
        if (!hasAllAmenities) {
           matches = false;
          }
      }
      
        return matches && room.isActive && room.isAvailableForBooking();
    });
   }

  // Method to get room statistics
   getStats() {
      return {
      totalRooms: this.totalRooms,
       availableRooms: this.availableRooms,
        pricePerNight: this.pricePerNight,
      capacity: this.capacity,
       isActive: this.isActive,
        isAvailable: this.isAvailable,
      isAvailableForBooking: this.isAvailableForBooking()
     };
    }

   // Method to get public room information
    getPublicInfo() {
    return {
       id: this.id,
        name: this.name,
      type: this.type,
       description: this.description,
        capacity: this.capacity,
      pricePerNight: this.pricePerNight,
       totalRooms: this.totalRooms,
        availableRooms: this.availableRooms,
      images: this.images,
       amenities: this.amenities,
        isAvailable: this.isAvailable,
      isAvailableForBooking: this.isAvailableForBooking()
     };
    }

   // Method to get detailed information (for owner/admin)
    getDetailedInfo() {
    return {
       ...this.getPublicInfo(),
        hotelId: this.hotelId,
      isActive: this.isActive,
       createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
   }
}

module.exports = Room;
