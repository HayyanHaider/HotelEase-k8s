const BaseRepository = require('./BaseRepository');
const RoomModel = require('../models/roomModel');

class RoomRepository extends BaseRepository {
   constructor() {
      super(RoomModel);
  }

    async findByHotel(hotelId, options = {}) {
    return this.find({ hotelId }, options);
   }

  async findAvailable(hotelId, options = {}) {
     return this.find({ hotelId, isAvailable: true, isActive: true }, options);
    }

   async findActive(hotelId, options = {}) {
      return this.find({ hotelId, isActive: true }, options);
  }
}

module.exports = new RoomRepository();

