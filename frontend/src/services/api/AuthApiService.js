import BaseApiService from './BaseApiService';

class AuthApiService extends BaseApiService {
 async register(userData) {
  return this.post('/auth/signup', userData);
 }

  async login(email, password) {
   return this.post('/auth/login', { email, password });
  }

 async getProfile() {
  return this.get('/auth/profile');
 }

  async updateProfile(profileData) {
   return this.put('/auth/profile', profileData);
  }

 async verifyToken() {
  return this.get('/auth/verify');
 }
}

export default new AuthApiService();
