const express = require('express');
const router = express.Router();
const geocodeController = require('../controllers/geocodeController');

router.get('/search', geocodeController.geocodeAddress);
router.get('/reverse', geocodeController.reverseGeocode);

module.exports = router;
