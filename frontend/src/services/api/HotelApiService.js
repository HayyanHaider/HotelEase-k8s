import BaseApiService from './BaseApiService';

class HotelApiService extends BaseApiService {
 async getHotels(filters = {}) {
  return this.get('/hotels', filters);
 }

  async getHotelById(hotelId) {
   return this.get(`/hotels/${hotelId}`);
  }

 async createHotel(hotelData) {
  return this.post('/hotels', hotelData);
 }

  async updateHotel(hotelId, hotelData) {
   return this.put(`/hotels/${hotelId}`, hotelData);
  }

 async deleteHotel(hotelId) {
  return this.delete(`/hotels/${hotelId}`);
 }

  async getOwnerHotels() {
   return this.get('/hotels/owner/my-hotels');
  }
}

export default new HotelApiService();
