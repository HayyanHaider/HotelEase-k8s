const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
   createCoupon,
    getHotelCoupons,
  getCouponDetails,
   updateCoupon,
    deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');

// Public route for customers to validate coupons
router.get('/validate', authenticateToken, validateCoupon);

// Protected routes - Hotel only
router.post('/', authenticateToken, authorizeRoles(['hotel']), createCoupon);
router.get('/hotel/:hotelId', authenticateToken, authorizeRoles(['hotel']), getHotelCoupons);
router.get('/:couponId', authenticateToken, authorizeRoles(['hotel']), getCouponDetails);
router.put('/:couponId', authenticateToken, authorizeRoles(['hotel']), updateCoupon);
router.delete('/:couponId', authenticateToken, authorizeRoles(['hotel']), deleteCoupon);

module.exports = router;

