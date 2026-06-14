class IHotelService {
   async createHotel(hotelData, ownerId) {
      throw new Error('createHotel method must be implemented');
  }

    async getHotels(filters = {}, options = {}) {
    throw new Error('getHotels method must be implemented');
   }

  async getHotelById(hotelId) {
     throw new Error('getHotelById method must be implemented');
    }

   async updateHotel(hotelId, updates, ownerId) {
      throw new Error('updateHotel method must be implemented');
  }

    async deleteHotel(hotelId, ownerId) {
    throw new Error('deleteHotel method must be implemented');
   }
}

module.exports = IHotelService;

