const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const bookingController = require('../controllers/bookingController');

router.post('/', authenticateToken, authorizeRoles(['customer']), bookingController.createBooking);
router.get('/my-bookings', authenticateToken, authorizeRoles(['customer']), bookingController.getUserBookings);
router.get('/:bookingId', authenticateToken, authorizeRoles(['customer']), bookingController.getBookingDetails);
router.put('/:bookingId/cancel', authenticateToken, authorizeRoles(['customer']), bookingController.cancelBooking);
router.put('/:bookingId/reschedule', authenticateToken, authorizeRoles(['customer']), bookingController.rescheduleBooking);

module.exports = router;
