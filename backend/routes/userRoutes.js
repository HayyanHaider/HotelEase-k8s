const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { addFavorite, removeFavorite, listFavorites } = require('../controllers/userController');

// Protected routes - Customer only
router.post('/favorites', authenticateToken, authorizeRoles(['customer']), addFavorite);
router.delete('/favorites/:hotelId', authenticateToken, authorizeRoles(['customer']), removeFavorite);
router.get('/favorites', authenticateToken, authorizeRoles(['customer']), listFavorites);

module.exports = router;

