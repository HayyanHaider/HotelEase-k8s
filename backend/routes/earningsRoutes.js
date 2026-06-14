const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const earningsController = require('../controllers/earningsController');

// Protected routes - Hotel only
router.get('/dashboard', authenticateToken, authorizeRoles(['hotel']), earningsController.getEarningsDashboard);
router.get('/hotel/:hotelId', authenticateToken, authorizeRoles(['hotel']), earningsController.getEarningsByHotel);

module.exports = router;

