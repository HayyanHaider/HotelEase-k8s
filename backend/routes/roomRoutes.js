const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
   createRoom,
    getHotelRooms,
  getRoomDetails,
   updateRoom,
    deleteRoom,
  toggleRoomAvailability,
   getAvailableRooms
} = require('../controllers/roomController');

// Public route - Get available rooms for hotel (for customers)
router.get('/hotel/:hotelId/available', getAvailableRooms);

// Protected routes - Hotel only
router.post('/', authenticateToken, authorizeRoles(['hotel']), createRoom);
router.get('/hotel/:hotelId', authenticateToken, authorizeRoles(['hotel']), getHotelRooms);
router.get('/:roomId', authenticateToken, authorizeRoles(['hotel']), getRoomDetails);
router.put('/:roomId', authenticateToken, authorizeRoles(['hotel']), updateRoom);
router.delete('/:roomId', authenticateToken, authorizeRoles(['hotel']), deleteRoom);
router.put('/:roomId/toggle-availability', authenticateToken, authorizeRoles(['hotel']), toggleRoomAvailability);

module.exports = router;

