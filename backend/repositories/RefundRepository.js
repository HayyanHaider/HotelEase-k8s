const BaseRepository = require('./BaseRepository');
const RefundModel = require('../models/refundModal');

class RefundRepository extends BaseRepository {
   constructor() {
      super(RefundModel);
  }

    async findByStatus(status, options = {}) {
    return this.find({ status }, options);
   }

  async findByUser(userId, options = {}) {
     return this.find({ userId }, options);
    }

   async findPending(options = {}) {
      return this.find({ status: 'pending' }, options);
  }
}

module.exports = new RefundRepository();

