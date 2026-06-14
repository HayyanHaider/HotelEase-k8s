const BaseRepository = require('./BaseRepository');
const UserModel = require('../models/userModel');

class UserRepository extends BaseRepository {
   constructor() {
      super(UserModel);
  }

    async findByEmail(email) {
    try {
       const doc = await this.model.findOne({ email: email.toLowerCase().trim() });
        return this.toObject(doc);
    } catch (error) {
       throw new Error(`Error finding user by email: ${error.message}`);
      }
  }

    async findByRole(role, options = {}) {
    return this.find({ role }, options);
   }

  async updateFavorites(userId, favorites) {
     try {
        const doc = await this.model.findByIdAndUpdate(
        userId,
         { favorites, updatedAt: new Date() },
          { new: true }
      );
       return this.toObject(doc);
      } catch (error) {
      throw new Error(`Error updating favorites: ${error.message}`);
     }
    }

   async addFavorite(userId, hotelId) {
      try {
      const doc = await this.model.findByIdAndUpdate(
         userId,
          { $addToSet: { favorites: hotelId }, updatedAt: new Date() },
        { new: true }
       );
        return this.toObject(doc);
    } catch (error) {
       throw new Error(`Error adding favorite: ${error.message}`);
      }
  }

    async removeFavorite(userId, hotelId) {
    try {
       const doc = await this.model.findByIdAndUpdate(
          userId,
        { $pull: { favorites: hotelId }, updatedAt: new Date() },
         { new: true }
        );
      return this.toObject(doc);
     } catch (error) {
        throw new Error(`Error removing favorite: ${error.message}`);
    }
   }
}

module.exports = new UserRepository();

