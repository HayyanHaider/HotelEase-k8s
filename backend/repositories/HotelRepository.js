const BaseRepository = require('./BaseRepository');
const HotelModel = require('../models/hotelModel');

class HotelRepository extends BaseRepository {
   constructor() {
      super(HotelModel);
  }

    async findByOwner(ownerId, options = {}) {
    return this.find({ ownerId }, options);
   }

  async findApproved(criteria = {}, options = {}) {
     return this.find({ ...criteria, isApproved: true, isSuspended: false }, options);
    }

   async findPending(options = {}) {
      return this.find({ isApproved: false, isSuspended: false }, options);
  }

    async findFlagged(options = {}) {
    return this.find({ isFlagged: true }, options);
   }

  async updateApprovalStatus(hotelId, isApproved, reason = '') {
     try {
        const updateData = {
        isApproved,
         updatedAt: new Date()
        };

       if (!isApproved && reason) {
          updateData.rejectionReason = reason;
      } else if (isApproved) {
         updateData.rejectionReason = '';
        }

       const doc = await this.model.findByIdAndUpdate(hotelId, updateData, { new: true });
        return this.toObject(doc);
    } catch (error) {
       throw new Error(`Error updating approval status: ${error.message}`);
      }
  }

    async updateRating(hotelId, newRating, totalReviews) {
    try {
       const doc = await this.model.findByIdAndUpdate(
          hotelId,
        {
           rating: newRating,
            ratingAvg: newRating,
          totalReviews,
           updatedAt: new Date()
          },
        { new: true }
       );
        return this.toObject(doc);
    } catch (error) {
       throw new Error(`Error updating rating: ${error.message}`);
      }
  }
}

module.exports = new HotelRepository();

