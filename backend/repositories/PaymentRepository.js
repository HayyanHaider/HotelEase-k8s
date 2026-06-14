const BaseRepository = require('./BaseRepository');
const PaymentModel = require('../models/paymentModel');

class PaymentRepository extends BaseRepository {
   constructor() {
      super(PaymentModel);
  }

    async findByBooking(bookingId, options = {}) {
    return this.find({ bookingId }, options);
   }

  async findByCustomer(customerId, options = {}) {
     return this.find({ customerId }, options);
    }

   async findByStatus(status, options = {}) {
      return this.find({ status }, options);
  }

    async findCompleted(criteria = {}, options = {}) {
    return this.find({ ...criteria, status: 'completed' }, options);
   }
}

module.exports = new PaymentRepository();

