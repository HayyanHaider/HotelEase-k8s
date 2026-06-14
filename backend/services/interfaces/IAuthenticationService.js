class IAuthenticationService {
   async register(userData) {
      throw new Error('register method must be implemented');
  }

    async login(email, password) {
    throw new Error('login method must be implemented');
   }

  async verifyToken(token) {
     throw new Error('verifyToken method must be implemented');
    }

   generateToken(user) {
      throw new Error('generateToken method must be implemented');
  }
}

module.exports = IAuthenticationService;

