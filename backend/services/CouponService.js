const BaseService = require('./BaseService');
const CouponRepository = require('../repositories/CouponRepository');
const HotelRepository = require('../repositories/HotelRepository');
const Coupon = require('../classes/Coupon');

class CouponService extends BaseService {
  constructor(dependencies = {}) {
     super(dependencies);
      this.couponRepository = dependencies.couponRepository || CouponRepository;
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
   }

  async createCoupon(couponData, ownerId) {
     try {
        this.validateRequired(couponData, ['hotelId', 'code', 'discountPercentage', 'validFrom', 'validTo']);
      this.validateRequired({ ownerId }, ['ownerId']);

        const hotel = await this.hotelRepository.findOne({ _id: couponData.hotelId, ownerId });
      if (!hotel) {
         throw new Error('Hotel not found or you do not have permission');
        }

       if (hotel.isSuspended) {
          throw new Error('Cannot create coupons for a suspended hotel');
      }

        const existingCoupon = await this.couponRepository.findByCode(couponData.code);
      if (existingCoupon) {
         throw new Error('Coupon code already exists');
        }

       if (!Coupon.isValidCodeFormat(couponData.code.toUpperCase())) {
          throw new Error('Invalid coupon code format');
      }

        const couponInstance = new Coupon({
        hotelId: couponData.hotelId,
         code: couponData.code.toUpperCase(),
          discountPercentage: couponData.discountPercentage,
        validFrom: couponData.validFrom,
         validTo: couponData.validTo,
          maxUses: couponData.maxUses || null,
        currentUses: 0
       });

      const validationErrors = couponInstance.validate();
       if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
      }

        const calculatedIsActive = couponInstance.calculateActiveStatus();

       const savedCoupon = await this.couponRepository.create({
          hotelId: couponInstance.hotelId,
        code: couponInstance.code,
         discountPercentage: couponInstance.discountPercentage,
          validFrom: couponInstance.validFrom,
        validTo: couponInstance.validTo,
         maxUses: couponInstance.maxUses,
          currentUses: couponInstance.currentUses,
        isActive: calculatedIsActive
       });

      couponInstance.id = savedCoupon._id || savedCoupon.id;

        return couponInstance.getPublicInfo();
    } catch (error) {
       this.handleError(error, 'Failed to create coupon');
      }
  }

    async getHotelCoupons(hotelId, ownerId) {
    try {
       if (!hotelId || !ownerId) {
          throw new Error('Hotel ID and Owner ID are required');
      }

        const hotel = await this.hotelRepository.findOne({ _id: hotelId, ownerId });
      if (!hotel) {
         throw new Error('Hotel not found or you do not have permission');
        }

       const coupons = await this.couponRepository.findByHotel(hotelId, {
          sort: { createdAt: -1 }
      });

        return coupons.map(coupon => {
        const couponInstance = new Coupon(coupon);
         return couponInstance.getPublicInfo();
        });
    } catch (error) {
       this.handleError(error, 'Failed to fetch coupons');
      }
  }

    async getCoupon(couponId, ownerId) {
    try {
       if (!couponId || !ownerId) {
          throw new Error('Coupon ID and Owner ID are required');
      }

        const coupon = await this.couponRepository.findById(couponId);
      if (!coupon) {
         throw new Error('Coupon not found');
        }

       const hotel = await this.hotelRepository.findOne({ _id: coupon.hotelId, ownerId });
        if (!hotel) {
        throw new Error('Coupon not found or you do not have permission');
       }

      const couponInstance = new Coupon(coupon);
       return couponInstance.getPublicInfo();
      } catch (error) {
      this.handleError(error, 'Failed to fetch coupon');
     }
    }

   async updateCoupon(couponId, updates, ownerId) {
      try {
      if (!couponId || !ownerId) {
         throw new Error('Coupon ID and Owner ID are required');
        }

       const coupon = await this.couponRepository.findById(couponId);
        if (!coupon) {
        throw new Error('Coupon not found');
       }

      const hotel = await this.hotelRepository.findOne({ _id: coupon.hotelId, ownerId });
       if (!hotel) {
          throw new Error('Not authorized to update this coupon');
      }

        const allowedFields = ['discountPercentage', 'validFrom', 'validTo', 'maxUses'];
      const updateData = {};

        allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
           updateData[field] = updates[field];
          }
      });

        const couponPlain = coupon.toObject ? coupon.toObject() : coupon;
      const tempCouponData = {
         ...couponPlain,
          ...updateData
      };
       const tempCouponInstance = new Coupon(tempCouponData);
      
      updateData.isActive = tempCouponInstance.calculateActiveStatus();

        const updatedCoupon = await this.couponRepository.updateById(couponId, updateData);
      const couponInstance = new Coupon(updatedCoupon);

        return couponInstance.getPublicInfo();
    } catch (error) {
       this.handleError(error, 'Failed to update coupon');
      }
  }

    async deleteCoupon(couponId, ownerId) {
    try {
       if (!couponId || !ownerId) {
          throw new Error('Coupon ID and Owner ID are required');
      }

        const coupon = await this.couponRepository.findById(couponId);
      if (!coupon) {
         throw new Error('Coupon not found');
        }

       const hotel = await this.hotelRepository.findOne({ _id: coupon.hotelId, ownerId });
        if (!hotel) {
        throw new Error('Not authorized to delete this coupon');
       }

      await this.couponRepository.deleteById(couponId);
       return true;
      } catch (error) {
      this.handleError(error, 'Failed to delete coupon');
     }
    }

  async validateCouponForBooking(couponCode, hotelId) {
    try {
      if (!couponCode || !hotelId) {
        throw new Error('Coupon code and hotel ID are required');
      }

      const couponDoc = await this.couponRepository.findByCode(couponCode.toUpperCase());
      
      if (!couponDoc) {
        throw new Error('Coupon code not found');
      }

      if (String(couponDoc.hotelId) !== String(hotelId)) {
        throw new Error('Coupon is not valid for this hotel');
      }

      if (couponDoc.maxUses && couponDoc.currentUses >= couponDoc.maxUses) {
        throw new Error('Coupon has reached its maximum usage limit');
      }

      if (!couponDoc.isActive) {
        throw new Error('Coupon is not active');
      }

      const couponInstance = new Coupon(couponDoc);
      if (!couponInstance.isValid()) {
        throw new Error('Coupon is expired or not yet active');
      }

      return {
        code: couponDoc.code,
        discountPercentage: couponDoc.discountPercentage,
        validFrom: couponDoc.validFrom,
        validTo: couponDoc.validTo
      };
    } catch (error) {
      this.handleError(error, 'Failed to validate coupon');
    }
  }
}

module.exports = new CouponService();
