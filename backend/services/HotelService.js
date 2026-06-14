const BaseService = require('./BaseService');
const IHotelService = require('./interfaces/IHotelService');
const HotelRepository = require('../repositories/HotelRepository');
const BookingRepository = require('../repositories/BookingRepository');
const Hotel = require('../classes/Hotel');

class HotelService extends BaseService {
   constructor(dependencies = {}) {
      super(dependencies);
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
     this.bookingRepository = dependencies.bookingRepository || BookingRepository;
    }

   #normalizeDate(date) {
      const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
     return normalized;
    }

   async #isHotelAvailableForRange(hotelId, totalRooms, checkInDate, checkOutDate) {
      const bookings = await this.bookingRepository.findOverlapping(
      hotelId,
       checkInDate,
        checkOutDate,
      ['cancelled']
     );

    if (bookings.length === 0) {
       return true;
      }

     const start = this.#normalizeDate(checkInDate);
      const end = this.#normalizeDate(checkOutDate);

     for (let day = new Date(start); day < end; day.setDate(day.getDate() + 1)) {
        const currentDay = this.#normalizeDate(day);
      const roomsBooked = bookings.reduce((count, booking) => {
         const bookingCheckIn = this.#normalizeDate(booking.checkIn);
          const bookingCheckOut = this.#normalizeDate(booking.checkOut);
        if (currentDay >= bookingCheckIn && currentDay < bookingCheckOut) {
           return count + 1;
          }
        return count;
       }, 0);

      if (roomsBooked >= totalRooms) {
         return false;
        }
    }

      return true;
  }

    async createHotel(hotelData, ownerId) {
    try {
       this.validateRequired({ ownerId }, ['ownerId']);

      const hotelInstance = new Hotel({
         ...hotelData,
          ownerId
      });

        const validationErrors = hotelInstance.validate();
      if (validationErrors.length > 0) {
         throw new Error(validationErrors.join(', '));
        }

       const savedHotel = await this.hotelRepository.create({
          name: hotelInstance.name,
        description: hotelInstance.description,
         location: hotelData.location || {},
          amenities: hotelInstance.amenities,
        images: hotelInstance.images,
         pricing: hotelData.pricing || {},
          capacity: hotelData.capacity || {},
        totalRooms: hotelInstance.totalRooms,
         ownerId: hotelInstance.ownerId,
          isApproved: false,
        rating: 0,
         totalReviews: 0
        });

       hotelInstance.id = savedHotel._id || savedHotel.id;

      return hotelInstance.getBasicInfo();
     } catch (error) {
        this.handleError(error, 'Failed to create hotel');
    }
   }

  async getHotels(filters = {}, options = {}) {
     try {
        const searchCriteria = {
        isApproved: true,
         isSuspended: { $ne: true }
        };

       const totalHotelsInDb = await this.hotelRepository.count({});
        const approvedHotelsInDb = await this.hotelRepository.count({ isApproved: true });
      console.log(`[HotelService] Database stats - Total: ${totalHotelsInDb}, Approved: ${approvedHotelsInDb}`);

        if (filters.location) {
        searchCriteria.$or = [
           { 'location.city': { $regex: filters.location, $options: 'i' } },
            { 'location.state': { $regex: filters.location, $options: 'i' } },
          { 'location.country': { $regex: filters.location, $options: 'i' } }
         ];
        }

       if (filters.amenities && filters.amenities.length > 0) {
          const amenityList = Array.isArray(filters.amenities) 
          ? filters.amenities 
           : String(filters.amenities).split(',');
          searchCriteria.amenities = { $all: amenityList };
      }

        if (filters.minRating) {
        searchCriteria.ratingAvg = { $gte: Number(filters.minRating) };
       }

      const sortOptions = {};
       if (options.sortBy === 'rating' || options.sortBy === 'price') {
          sortOptions.createdAt = -1;
      } else if (options.sortBy === 'popularity') {
         sortOptions.totalReviews = options.order === 'desc' ? -1 : 1;
        } else {
        sortOptions.createdAt = -1;
       }

      const pageNum = options.page ? Number(options.page) : 1;
       const limitNum = options.limit ? Number(options.limit) : 50;
        const skipNum = (pageNum - 1) * limitNum;

       const dbHotels = await this.hotelRepository.find(searchCriteria, {
          sort: sortOptions,
        limit: limitNum,
         skip: skipNum
        });

       console.log(`[HotelService] Found ${dbHotels.length} hotels from database`);

      const hotelInstances = dbHotels.map(dbHotel => {
         try {
            return new Hotel(dbHotel);
        } catch (error) {
           console.error('[HotelService] Error creating Hotel instance:', error);
            console.error('[HotelService] Hotel data:', JSON.stringify(dbHotel, null, 2));
          throw error;
         }
        });

       let filteredHotels = hotelInstances;
        console.log(`[HotelService] After creating instances: ${filteredHotels.length} hotels`);

       if (filters.guests) {
          try {
          const requestedGuests = parseInt(filters.guests) || 1;
           const beforeGuestFilter = filteredHotels.length;
            console.log(`[HotelService] Filtering by guests: ${requestedGuests}, hotels before filter: ${beforeGuestFilter}`);
          
           filteredHotels = filteredHotels.filter(hotel => {
              try {
              const hasCapacity = hotel.hasAvailableCapacity(requestedGuests);
              
                const hotelCapacity = hotel.capacity?.guests;
              const capacityNum = hotelCapacity ? parseInt(hotelCapacity) : 'N/A';
              
                if (!hasCapacity) {
                console.log(`[HotelService] Hotel "${hotel.name}" filtered out - capacity: ${capacityNum}, requested: ${requestedGuests}, isBookable: ${hotel.isBookable()}`);
               } else {
                  console.log(`[HotelService] Hotel "${hotel.name}" has capacity - capacity: ${capacityNum}, requested: ${requestedGuests} ✓`);
              }
              
                return hasCapacity;
            } catch (error) {
               console.error(`[HotelService] Error checking capacity for hotel "${hotel.name}":`, error);
                return hotel.isApproved && !hotel.isSuspended;
            }
           });
          
          console.log(`[HotelService] After guest filter (${requestedGuests} guests): ${beforeGuestFilter} -> ${filteredHotels.length} hotels`);
         } catch (error) {
            console.error('[HotelService] Error filtering by guests:', error);
        }
       }

      if (filters.checkIn && filters.checkOut) {
         const checkInDate = new Date(filters.checkIn);
          const checkOutDate = new Date(filters.checkOut);
        
        console.log(`[HotelService] Filtering by dates - CheckIn: ${checkInDate.toISOString()}, CheckOut: ${checkOutDate.toISOString()}`);
         console.log(`[HotelService] Date validation - CheckIn valid: ${!isNaN(checkInDate.getTime())}, CheckOut valid: ${!isNaN(checkOutDate.getTime())}`);
        
        // Validate dates
         if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            console.log('[HotelService] Invalid dates provided, skipping date filtering');
        } else if (checkInDate >= checkOutDate) {
           console.log('[HotelService] CheckIn date is after or equal to CheckOut date, skipping date filtering');
          } else {
          const hotelIds = filteredHotels
             .map(h => {
                const id = h.id;
              return id ? (id.toString ? id.toString() : String(id)) : null;
             })
              .filter(Boolean);

           const availabilityChecks = await Promise.all(
              hotelIds.map(async (hotelId) => {
              const hotel = filteredHotels.find(h => {
                 const hId = h.id ? (h.id.toString ? h.id.toString() : String(h.id)) : null;
                  return hId === hotelId;
              });
               if (!hotel) {
                console.log(`[HotelService] Hotel not found for ID: ${hotelId}`);
                 return false;
                }

              const isAvailable = await this.#isHotelAvailableForRange(
                 hotelId,
                  hotel.totalRooms,
                checkInDate,
                 checkOutDate
                );

               const hasRooms = hotel.hasAvailableRooms(checkInDate, checkOutDate, filters.guests || 1);
              
                console.log(`[HotelService] Hotel "${hotel.name}" - Available in range: ${isAvailable}, Has rooms: ${hasRooms}, Result: ${isAvailable && hasRooms}`);

               return isAvailable && hasRooms;
              })
          );

            const beforeDateFilter = filteredHotels.length;
          filteredHotels = filteredHotels.filter((_, index) => 
            availabilityChecks[index]
           );
            console.log(`[HotelService] After date filter: ${beforeDateFilter} -> ${filteredHotels.length} hotels`);
        }
      }

       if (filters.minPrice || filters.maxPrice) {
          filteredHotels = filteredHotels.filter(hotel => {
          const priceRange = hotel.getPriceRange();
           if (filters.minPrice && priceRange.min < parseFloat(filters.minPrice)) return false;
            if (filters.maxPrice && priceRange.max > parseFloat(filters.maxPrice)) return false;
          return true;
         });
        }

       if (options.sortBy === 'price') {
          const order = options.order || 'asc';
        console.log(`[HotelService] Sorting by price with order: ${order}`);
         filteredHotels = filteredHotels.sort((a, b) => {
            const priceA = parseFloat(a.getPriceRange().min || 0);
          const priceB = parseFloat(b.getPriceRange().min || 0);
           console.log(`[HotelService] Comparing "${a.name}" (PKR ${priceA}) vs "${b.name}" (PKR ${priceB})`);
            if (order === 'desc') {
            return priceB - priceA;
           } else {
              return priceA - priceB;
          }
         });
          console.log(`[HotelService] After price sort, first hotel: "${filteredHotels[0]?.name}" with price PKR ${filteredHotels[0]?.getPriceRange().min || 0}`);
      }

        if (options.sortBy === 'rating') {
        const order = options.order || 'desc';
         console.log(`[HotelService] Sorting by rating with order: ${order}`);
          filteredHotels = filteredHotels.sort((a, b) => {
          const ratingA = parseFloat(a.ratingAvg || a.rating || 0);
           const ratingB = parseFloat(b.ratingAvg || b.rating || 0);
            console.log(`[HotelService] Comparing "${a.name}" (${ratingA}) vs "${b.name}" (${ratingB})`);
          if (order === 'desc') {
             return ratingB - ratingA;
            } else {
            return ratingA - ratingB;
           }
          });
        console.log(`[HotelService] After rating sort, first hotel: "${filteredHotels[0]?.name}" with rating ${filteredHotels[0]?.ratingAvg || filteredHotels[0]?.rating || 0}`);
       }

      const hotelsData = [];
       for (const hotel of filteredHotels) {
          try {
          const hotelData = hotel.getSearchResult();
           hotelsData.push(hotelData);
          } catch (error) {
          console.error('[HotelService] Error calling getSearchResult for hotel:', error);
           console.error('[HotelService] Hotel ID:', hotel.id || hotel._id);
            console.error('[HotelService] Hotel name:', hotel.name);
        }
       }

      console.log(`[HotelService] Returning ${hotelsData.length} hotels after filtering`);

        const totalCount = await this.hotelRepository.count(searchCriteria);

       return {
          hotels: hotelsData,
        count: hotelsData.length,
         total: totalCount,
          pagination: {
          page: pageNum,
           limit: limitNum,
            total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
         }
        };
    } catch (error) {
       console.error('[HotelService] Error in getHotels:', error);
        console.error('[HotelService] Error stack:', error.stack);
      throw this.handleError(error, 'Failed to fetch hotels');
     }
    }

   async getHotelById(hotelId) {
      try {
      if (!hotelId) {
         throw new Error('Hotel ID is required');
        }

       const dbHotel = await this.hotelRepository.findById(hotelId);
        if (!dbHotel) {
        throw new Error('Hotel not found');
       }

      const hotelInstance = new Hotel(dbHotel);
       return hotelInstance.getDetailedInfo();
      } catch (error) {
      this.handleError(error, 'Failed to fetch hotel');
     }
    }

   async updateHotel(hotelId, updates, ownerId) {
      try {
      if (!hotelId || !ownerId) {
         throw new Error('Hotel ID and Owner ID are required');
        }

       const existingHotel = await this.hotelRepository.findOne({
          _id: hotelId,
        ownerId
       });

      if (!existingHotel) {
         throw new Error('Hotel not found or you do not have permission to update it');
        }

       const updateData = {};
        const allowedFields = ['name', 'description', 'amenities', 'images', 'location', 'pricing', 'capacity', 'totalRooms'];

       allowedFields.forEach(field => {
          if (updates[field] !== undefined) {
          updateData[field] = updates[field];
         }
        });

       if (updates.location) {
          updateData.location = {
          ...existingHotel.location,
           ...updates.location
          };
      }

        if (updates.pricing) {
        updateData.pricing = {
           ...existingHotel.pricing,
            ...updates.pricing
        };
       }

      if (updates.capacity) {
         updateData.capacity = {
            ...existingHotel.capacity,
          ...updates.capacity
         };
        }

       const updatedHotel = await this.hotelRepository.updateById(hotelId, updateData);
        const hotelInstance = new Hotel(updatedHotel);

       return hotelInstance.getBasicInfo();
      } catch (error) {
      this.handleError(error, 'Failed to update hotel');
     }
    }

   async deleteHotel(hotelId, ownerId) {
      try {
      if (!hotelId || !ownerId) {
         throw new Error('Hotel ID and Owner ID are required');
        }

       const existingHotel = await this.hotelRepository.findOne({
          _id: hotelId,
        ownerId
       });

      if (!existingHotel) {
         throw new Error('Hotel not found or you do not have permission to delete it');
        }

       await this.hotelRepository.deleteById(hotelId);
        return true;
    } catch (error) {
       this.handleError(error, 'Failed to delete hotel');
      }
  }

    async getOwnerHotels(ownerId) {
    try {
       if (!ownerId) {
          throw new Error('Owner ID is required');
      }

        const dbHotels = await this.hotelRepository.findByOwner(ownerId, {
        sort: { createdAt: -1 }
       });

      const hotelInstances = dbHotels.map(dbHotel => new Hotel(dbHotel));
       return hotelInstances.map(hotel => hotel.getSearchResult());
      } catch (error) {
      this.handleError(error, 'Failed to fetch owner hotels');
     }
    }
}

module.exports = new HotelService();
