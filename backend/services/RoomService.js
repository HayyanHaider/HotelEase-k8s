const BaseService = require('./BaseService');
const RoomRepository = require('../repositories/RoomRepository');
const HotelRepository = require('../repositories/HotelRepository');
const Room = require('../classes/Room');

class RoomService extends BaseService {
  constructor(dependencies = {}) {
     super(dependencies);
      this.roomRepository = dependencies.roomRepository || RoomRepository;
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
   }

  async createRoom(roomData, ownerId) {
     try {
        this.validateRequired(roomData, ['hotelId', 'name', 'type', 'pricePerNight', 'capacity']);
      this.validateRequired({ ownerId }, ['ownerId']);

        const hotel = await this.hotelRepository.findOne({ _id: roomData.hotelId, ownerId });
      if (!hotel) {
         throw new Error('Hotel not found or you do not have permission');
        }

       const roomInstance = new Room({
          hotelId: roomData.hotelId,
        name: roomData.name,
         type: roomData.type,
          description: roomData.description || '',
        pricePerNight: roomData.pricePerNight,
         capacity: roomData.capacity,
          amenities: roomData.amenities || [],
        images: roomData.images || [],
         isAvailable: true,
          isActive: true
      });

        const validationErrors = roomInstance.validate();
      if (validationErrors.length > 0) {
         throw new Error(validationErrors.join(', '));
        }

       const savedRoom = await this.roomRepository.create({
          hotelId: roomInstance.hotelId,
        name: roomInstance.name,
         type: roomInstance.type,
          description: roomInstance.description,
        pricePerNight: roomInstance.pricePerNight,
         capacity: roomInstance.capacity,
          amenities: roomInstance.amenities,
        images: roomInstance.images,
         isAvailable: roomInstance.isAvailable,
          isActive: roomInstance.isActive
      });

        roomInstance.id = savedRoom._id || savedRoom.id;

       return roomInstance.getPublicInfo();
      } catch (error) {
      this.handleError(error, 'Failed to create room');
     }
    }

   async getHotelRooms(hotelId, ownerId = null) {
      try {
      if (!hotelId) {
         throw new Error('Hotel ID is required');
        }

       if (ownerId) {
          const hotel = await this.hotelRepository.findOne({ _id: hotelId, ownerId });
        if (!hotel) {
           throw new Error('Hotel not found or you do not have permission');
          }
      }

        const rooms = await this.roomRepository.findByHotel(hotelId, {
        sort: { createdAt: -1 }
       });

      return rooms.map(room => {
         const roomInstance = new Room(room);
          return roomInstance.getPublicInfo();
      });
     } catch (error) {
        this.handleError(error, 'Failed to fetch rooms');
    }
   }

  async updateRoom(roomId, updates, ownerId) {
     try {
        if (!roomId || !ownerId) {
        throw new Error('Room ID and Owner ID are required');
       }

      const room = await this.roomRepository.findById(roomId);
       if (!room) {
          throw new Error('Room not found');
      }

        const hotel = await this.hotelRepository.findOne({ _id: room.hotelId, ownerId });
      if (!hotel) {
         throw new Error('Not authorized to update this room');
        }

       const allowedFields = ['name', 'type', 'description', 'pricePerNight', 'capacity', 'amenities', 'images', 'isAvailable', 'isActive'];
        const updateData = {};

       allowedFields.forEach(field => {
          if (updates[field] !== undefined) {
          updateData[field] = updates[field];
         }
        });

       const updatedRoom = await this.roomRepository.updateById(roomId, updateData);
        const roomInstance = new Room(updatedRoom);

       return roomInstance.getPublicInfo();
      } catch (error) {
      this.handleError(error, 'Failed to update room');
     }
    }

   async deleteRoom(roomId, ownerId) {
      try {
      if (!roomId || !ownerId) {
         throw new Error('Room ID and Owner ID are required');
        }

       const room = await this.roomRepository.findById(roomId);
        if (!room) {
        throw new Error('Room not found');
       }

      const hotel = await this.hotelRepository.findOne({ _id: room.hotelId, ownerId });
       if (!hotel) {
          throw new Error('Not authorized to delete this room');
      }

        await this.roomRepository.deleteById(roomId);
      return true;
     } catch (error) {
        this.handleError(error, 'Failed to delete room');
    }
   }

  async toggleRoomAvailability(roomId, ownerId) {
     try {
        if (!roomId || !ownerId) {
        throw new Error('Room ID and Owner ID are required');
       }

      const room = await this.roomRepository.findById(roomId);
       if (!room) {
          throw new Error('Room not found');
      }

        const hotel = await this.hotelRepository.findOne({ _id: room.hotelId, ownerId });
      if (!hotel) {
         throw new Error('Not authorized to update this room');
        }

       const updatedRoom = await this.roomRepository.updateById(roomId, {
          isAvailable: !room.isAvailable
      });

        const roomInstance = new Room(updatedRoom);
      return roomInstance.getPublicInfo();
     } catch (error) {
        this.handleError(error, 'Failed to toggle room availability');
    }
   }

  async getAvailableRooms(hotelId, filters = {}) {
     try {
        if (!hotelId) {
        throw new Error('Hotel ID is required');
       }

      const rooms = await this.roomRepository.findAvailable(hotelId, {
         sort: { pricePerNight: 1 }
        });

       let filteredRooms = rooms;
        if (filters.guests) {
        filteredRooms = filteredRooms.filter(room => room.capacity >= parseInt(filters.guests));
       }

      return filteredRooms.map(room => {
         const roomInstance = new Room(room);
          return roomInstance.getPublicInfo();
      });
     } catch (error) {
        this.handleError(error, 'Failed to fetch available rooms');
    }
   }
}

module.exports = new RoomService();
