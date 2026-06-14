const BaseRepository = require('./BaseRepository');
const CouponModel = require('../models/couponModel');

class CouponRepository extends BaseRepository {
   constructor() {
      super(CouponModel);
  }

    async findByHotel(hotelId, options = {}) {
    return this.find({ hotelId }, options);
   }

  async findByCode(code) {
     try {
        const doc = await this.model.findOne({ code: code.toUpperCase() });
      return this.toObject(doc);
     } catch (error) {
        throw new Error(`Error finding coupon by code: ${error.message}`);
    }
   }

  async findActive(criteria = {}, options = {}) {
     const now = new Date();
      return this.find({
      ...criteria,
       isActive: true,
        validFrom: { $lte: now },
      validTo: { $gte: now }
     }, options);
    }

   async incrementUsage(couponId) {
      try {
      const doc = await this.model.findByIdAndUpdate(
         couponId,
          { $inc: { currentUses: 1 } },
        { new: true }
       );
        return this.toObject(doc);
    } catch (error) {
       throw new Error(`Error incrementing coupon usage: ${error.message}`);
      }
  }

    async decrementUsage(couponId) {
    try {
       const doc = await this.model.findByIdAndUpdate(
          couponId,
        { $inc: { currentUses: -1 } },
         { new: true }
        );
      return this.toObject(doc);
     } catch (error) {
        throw new Error(`Error decrementing coupon usage: ${error.message}`);
    }
   }
}

module.exports = new CouponRepository();

