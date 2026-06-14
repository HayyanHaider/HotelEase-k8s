const BaseRepository = require('./BaseRepository');
const CustomerModel = require('../models/customerModel');

class CustomerRepository extends BaseRepository {
   constructor() {
      super(CustomerModel);
  }

    async findByUser(userId) {
    try {
       const doc = await this.model.findOne({ user: userId });
        return this.toObject(doc);
    } catch (error) {
       throw new Error(`Error finding customer by user: ${error.message}`);
      }
  }

    async findOrCreateByUser(userId) {
    try {
       let customer = await this.findByUser(userId);
        if (!customer) {
        const doc = await this.model.create({
           user: userId,
            loyaltyPoints: 0,
          bookingHistory: [],
           reviewsGiven: []
          });
        customer = this.toObject(doc);
       }
        return customer;
    } catch (error) {
       throw new Error(`Error finding or creating customer: ${error.message}`);
      }
  }

    async updateLoyaltyPoints(customerId, points) {
    try {
       const doc = await this.model.findByIdAndUpdate(
          customerId,
        { $inc: { loyaltyPoints: points }, updatedAt: new Date() },
         { new: true }
        );
      return this.toObject(doc);
     } catch (error) {
        throw new Error(`Error updating loyalty points: ${error.message}`);
    }
   }
}

module.exports = new CustomerRepository();

