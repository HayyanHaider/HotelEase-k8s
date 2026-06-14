const BaseController = require('./BaseController');
const CouponService = require('../services/CouponService');

class CouponController extends BaseController {
   constructor() {
      super();
    this.couponService = CouponService;
   }

  createCoupon = async (req, res) => {
     try {
        const ownerId = req.user.userId;
      const { hotelId, code, discountPercentage, validFrom, validTo, maxUses } = req.body;

        if (!hotelId || !code || discountPercentage === undefined || !validFrom || !validTo) {
        return this.fail(res, 400, 'hotelId, code, discountPercentage, validFrom, and validTo are required');
       }

      const coupon = await this.couponService.createCoupon({
         hotelId,
          code,
        discountPercentage,
         validFrom: new Date(validFrom),
          validTo: new Date(validTo),
        maxUses: maxUses || null
       }, ownerId);

      return this.created(res, {
         message: 'Coupon created successfully',
          coupon
      });
     } catch (error) {
        console.error('Create coupon error:', error);
      const status = error.message.includes('not found') || error.message.includes('permission') ? 404 :
         error.message.includes('already exists') || error.message.includes('Invalid') ? 400 :
            error.message.includes('suspended') ? 403 : 500;
      return this.fail(res, status, error.message || 'Server error while creating coupon');
     }
    };

   getHotelCoupons = async (req, res) => {
      try {
      const ownerId = req.user.userId;
       const { hotelId } = req.params;

      const coupons = await this.couponService.getHotelCoupons(hotelId, ownerId);

        return this.ok(res, {
        count: coupons.length,
         coupons
        });
    } catch (error) {
       console.error('Get hotel coupons error:', error);
        const status = error.message.includes('not found') || error.message.includes('permission') ? 404 : 500;
      return this.fail(res, status, error.message || 'Server error while fetching coupons');
     }
    };

   getCouponDetails = async (req, res) => {
      try {
      const ownerId = req.user.userId;
       const { couponId } = req.params;
        const coupon = await this.couponService.getCoupon(couponId, ownerId);
      return this.ok(res, { coupon });
     } catch (error) {
        console.error('Get coupon details error:', error);
      return this.fail(res, 500, error.message || 'Server error while fetching coupon details');
     }
    };

   updateCoupon = async (req, res) => {
      try {
      const ownerId = req.user.userId;
       const { couponId } = req.params;
        const { discountPercentage, validFrom, validTo, maxUses, isActive } = req.body;

       const updateData = {};
        if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
      if (validFrom) updateData.validFrom = new Date(validFrom);
       if (validTo) updateData.validTo = new Date(validTo);
        if (maxUses !== undefined) updateData.maxUses = maxUses;
      if (isActive !== undefined) updateData.isActive = isActive;

        const coupon = await this.couponService.updateCoupon(couponId, updateData, ownerId);

       return this.ok(res, {
          message: 'Coupon updated successfully',
        coupon
       });
      } catch (error) {
      console.error('Update coupon error:', error);
       const status = error.message.includes('not found') ? 404 :
          error.message.includes('authorized') ? 403 : 500;
      return this.fail(res, status, error.message || 'Server error while updating coupon');
     }
    };

   deleteCoupon = async (req, res) => {
      try {
      const ownerId = req.user.userId;
       const { couponId } = req.params;

      await this.couponService.deleteCoupon(couponId, ownerId);

        return this.ok(res, {
        message: 'Coupon deleted successfully'
       });
      } catch (error) {
      console.error('Delete coupon error:', error);
       const status = error.message.includes('not found') ? 404 :
          error.message.includes('authorized') ? 403 : 500;
      return this.fail(res, status, error.message || 'Server error while deleting coupon');
     }
    };

  validateCoupon = async (req, res) => {
    try {
      const { code, hotelId } = req.query;

      if (!code || !hotelId) {
        return this.fail(res, 400, 'Coupon code and hotel ID are required');
      }

      const coupon = await this.couponService.validateCouponForBooking(code, hotelId);

      return this.ok(res, {
        message: 'Coupon is valid',
        coupon
      });
    } catch (error) {
      console.error('Validate coupon error:', error);
      const status = error.message.includes('not found') || error.message.includes('not valid') ? 404 :
        error.message.includes('expired') || error.message.includes('maximum') || error.message.includes('not active') ? 400 : 500;
      return this.fail(res, status, error.message || 'Server error while validating coupon');
    }
  };
}

const couponController = new CouponController();

module.exports = {
    createCoupon: couponController.createCoupon,
  getHotelCoupons: couponController.getHotelCoupons,
   getCouponDetails: couponController.getCouponDetails,
    updateCoupon: couponController.updateCoupon,
  deleteCoupon: couponController.deleteCoupon,
  validateCoupon: couponController.validateCoupon
};

