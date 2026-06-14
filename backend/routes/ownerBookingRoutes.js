const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const ownerBookingController = require('../controllers/ownerBookingController');

router.use(authenticateToken, authorizeRoles(['hotel']));

router.get('/', ownerBookingController.getOwnerBookings);
router.put('/:bookingId/confirm', ownerBookingController.confirmBooking);
router.put('/:bookingId/reject', ownerBookingController.rejectBooking);
router.put('/:bookingId/check-in', ownerBookingController.checkIn);
router.put('/:bookingId/check-out', ownerBookingController.checkOut);

module.exports = router;


