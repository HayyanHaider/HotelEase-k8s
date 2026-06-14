import BaseApiService from './BaseApiService';

class UserApiService extends BaseApiService {
 async getFavorites() {
  return this.get('/users/favorites');
 }

  async addFavorite(hotelId) {
   return this.post('/users/favorites', { hotelId });
  }

 async removeFavorite(hotelId) {
  return this.delete(`/users/favorites/${hotelId}`);
 }
}

export default new UserApiService();
