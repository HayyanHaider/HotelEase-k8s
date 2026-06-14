const BaseController = require('./BaseController');
const RoomService = require('../services/RoomService');

class RoomController extends BaseController {
   constructor() {
      super();
    this.roomService = RoomService;
   }

  createRoom = async (req, res) => {
     try {
        const ownerId = req.user.userId;
      const { hotelId, name, type, description, pricePerNight, capacity, amenities, images } = req.body;

        if (!hotelId || !name || !type || !pricePerNight || !capacity) {
        return this.fail(res, 400, 'hotelId, name, type, pricePerNight, and capacity are required');
       }

      const room = await this.roomService.createRoom({
         hotelId,
          name,
        type,
         description,
          pricePerNight,
        capacity,
         amenities,
          images
      }, ownerId);

        return this.created(res, {
        message: 'Room created successfully',
         room
        });
    } catch (error) {
       console.error('Create room error:', error);
        const status = error.message.includes('not found') || error.message.includes('permission') ? 404 :
                    error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500;
       return this.fail(res, status, error.message || 'Server error while creating room');
      }
  };

    getHotelRooms = async (req, res) => {
    try {
       const ownerId = req.user.userId;
        const { hotelId } = req.params;

       const rooms = await this.roomService.getHotelRooms(hotelId, ownerId);

      return this.ok(res, {
         count: rooms.length,
          rooms
      });
     } catch (error) {
        console.error('Get hotel rooms error:', error);
      const status = error.message.includes('not found') || error.message.includes('permission') ? 404 : 500;
       return this.fail(res, status, error.message || 'Server error while fetching rooms');
      }
  };

    getRoomDetails = async (req, res) => {
    try {
       const ownerId = req.user.userId;
        const { roomId } = req.params;

       const rooms = await this.roomService.getHotelRooms(null, ownerId);
        const room = rooms.find(r => (r.id || r._id)?.toString() === roomId);

       if (!room) {
          return this.fail(res, 404, 'Room not found');
      }

        return this.ok(res, { room });
    } catch (error) {
       console.error('Get room details error:', error);
        return this.fail(res, 500, error.message || 'Server error while fetching room details');
    }
   };

  updateRoom = async (req, res) => {
     try {
        const ownerId = req.user.userId;
      const { roomId } = req.params;
       const updates = req.body;

      const room = await this.roomService.updateRoom(roomId, updates, ownerId);

        return this.ok(res, {
        message: 'Room updated successfully',
         room
        });
    } catch (error) {
       console.error('Update room error:', error);
        const status = error.message.includes('not found') ? 404 :
                    error.message.includes('authorized') ? 403 : 500;
       return this.fail(res, status, error.message || 'Server error while updating room');
      }
  };

    deleteRoom = async (req, res) => {
    try {
       const ownerId = req.user.userId;
        const { roomId } = req.params;

       await this.roomService.deleteRoom(roomId, ownerId);

      return this.ok(res, {
         message: 'Room deleted successfully'
        });
    } catch (error) {
       console.error('Delete room error:', error);
        const status = error.message.includes('not found') ? 404 :
                    error.message.includes('authorized') ? 403 : 500;
       return this.fail(res, status, error.message || 'Server error while deleting room');
      }
  };

    toggleRoomAvailability = async (req, res) => {
    try {
       const ownerId = req.user.userId;
        const { roomId } = req.params;

       const room = await this.roomService.toggleRoomAvailability(roomId, ownerId);

      return this.ok(res, {
         message: `Room ${room.isAvailable ? 'activated' : 'deactivated'} successfully`,
          room
      });
     } catch (error) {
        console.error('Toggle room availability error:', error);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('authorized') ? 403 : 500;
        return this.fail(res, status, error.message || 'Server error while updating room availability');
    }
   };

  getAvailableRooms = async (req, res) => {
     try {
        const { hotelId } = req.params;
      const { checkIn, checkOut, guests } = req.query;

        const filters = {};
      if (guests) filters.guests = guests;
       if (checkIn) filters.checkIn = checkIn;
        if (checkOut) filters.checkOut = checkOut;

       const rooms = await this.roomService.getAvailableRooms(hotelId, filters);

      return this.ok(res, {
         count: rooms.length,
          rooms
      });
     } catch (error) {
        console.error('Get available rooms error:', error);
      return this.fail(res, 500, error.message || 'Server error while fetching rooms');
     }
    };
}

const roomController = new RoomController();

module.exports = {
    createRoom: roomController.createRoom,
  getHotelRooms: roomController.getHotelRooms,
   getRoomDetails: roomController.getRoomDetails,
    updateRoom: roomController.updateRoom,
  deleteRoom: roomController.deleteRoom,
   toggleRoomAvailability: roomController.toggleRoomAvailability,
    getAvailableRooms: roomController.getAvailableRooms
};

