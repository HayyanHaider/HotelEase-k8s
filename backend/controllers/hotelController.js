const BaseController = require('./BaseController');
const HotelService = require('../services/HotelService');

class HotelController extends BaseController {
   constructor() {
      super();
    this.hotelService = HotelService;
   }

  createHotel = async (req, res) => {
     try {
        const { name, description, location, amenities, images, contactInfo, pricing, capacity, totalRooms } = req.body;
      const ownerId = req.user.userId;

        const normalizedImages = Array.isArray(images) 
        ? images.map(img => typeof img === 'string' ? img : (img?.url || String(img)))
         : [];

      const hotel = await this.hotelService.createHotel({
         name,
          description,
        location,
         amenities,
          images: normalizedImages,
        contactInfo,
         pricing,
          capacity,
        totalRooms
       }, ownerId);

      return this.created(res, {
         message: 'Hotel created successfully and pending approval',
          hotel
      });

      } catch (error) {
      console.error('Create hotel error:', error);
       return this.fail(res, error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500, 
          error.message || 'Server error while creating hotel');
    }
   };

  getHotels = async (req, res) => {
     try {
        const { location, checkIn, checkOut, guests, minPrice, maxPrice, amenities, minRating, sortBy, order = 'asc', page = 1, limit = 10 } = req.query;

       const filters = {
          location,
        checkIn,
         checkOut,
          guests,
        minPrice,
         maxPrice,
          amenities: amenities ? (Array.isArray(amenities) ? amenities : String(amenities).split(',')) : undefined,
        minRating
       };

      const options = {
         sortBy: sortBy || 'popularity',
          order,
        page: parseInt(page) || 1,
         limit: parseInt(limit) || 50
        };

       console.log('[HotelController] getHotels called with filters:', JSON.stringify(filters, null, 2));
        console.log('[HotelController] getHotels called with options:', JSON.stringify(options, null, 2));

       const result = await this.hotelService.getHotels(filters, options);

      console.log('[HotelController] getHotels result:', {
         hotelsCount: result.hotels?.length || 0,
          total: result.total,
        count: result.count
       });

      return this.ok(res, {
         count: result.count,
          total: result.total,
        hotels: result.hotels,
         pagination: result.pagination
        });

     } catch (error) {
        console.error('[HotelController] Get hotels error:', error);
      console.error('[HotelController] Error stack:', error.stack);
       return this.fail(res, 500, error.message || 'Server error while fetching hotels');
      }
  };

    getHotelDetails = async (req, res) => {
    try {
       const { hotelId } = req.params;

      const hotel = await this.hotelService.getHotelById(hotelId);

        return this.ok(res, {
        hotel
       });

    } catch (error) {
       console.error('Get hotel details error:', error);
        const status = error.message.includes('not found') ? 404 : 500;
      return this.fail(res, status, error.message || 'Server error while fetching hotel details');
     }
    };

   updateHotel = async (req, res) => {
      try {
      const { hotelId } = req.params;
       const ownerId = req.user.userId;
        const { name, description, location, amenities, images, contactInfo, pricing, capacity, totalRooms } = req.body;

       const normalizedImages = images !== undefined
          ? (Array.isArray(images) 
          ? images.map(img => typeof img === 'string' ? img : (img?.url || String(img)))
           : [])
          : undefined;

       const hotel = await this.hotelService.updateHotel(hotelId, {
          name,
        description,
         location,
          amenities,
        images: normalizedImages,
         contactInfo,
          pricing,
        capacity,
         totalRooms
        }, ownerId);

       return this.ok(res, {
          message: 'Hotel updated successfully',
        hotel
       });

    } catch (error) {
       console.error('Update hotel error:', error);
        const status = error.message.includes('not found') || error.message.includes('permission') ? 404 : 500;
      return this.fail(res, status, error.message || 'Server error while updating hotel');
     }
    };

   getOwnerHotels = async (req, res) => {
      try {
      const ownerId = req.user.userId;

        const hotels = await this.hotelService.getOwnerHotels(ownerId);

       return this.ok(res, {
          count: hotels.length,
        hotels
       });

    } catch (error) {
       console.error('Get owner hotels error:', error);
        return this.fail(res, 500, error.message || 'Server error while fetching your hotels');
    }
   };

  deleteHotel = async (req, res) => {
     try {
        const { hotelId } = req.params;
      const ownerId = req.user.userId;

        await this.hotelService.deleteHotel(hotelId, ownerId);

       return this.ok(res, {
          message: 'Hotel deleted successfully'
      });

      } catch (error) {
      console.error('Delete hotel error:', error);
       const status = error.message.includes('not found') || error.message.includes('permission') ? 404 : 500;
        return this.fail(res, status, error.message || 'Server error while deleting hotel');
    }
   };
}

const hotelController = new HotelController();

module.exports = {
   createHotel: hotelController.createHotel,
    getHotels: hotelController.getHotels,
  getHotelDetails: hotelController.getHotelDetails,
   getOwnerHotels: hotelController.getOwnerHotels,
    updateHotel: hotelController.updateHotel,
  deleteHotel: hotelController.deleteHotel
};
