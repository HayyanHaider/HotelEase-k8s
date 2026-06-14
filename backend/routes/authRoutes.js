const express = require('express');
const router = express.Router();
const { signup, login, getProfile, verifyTokenController, updateProfile } = require('../controllers/authController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');
const { initiateGmailAuth, handleGmailCallback, checkGmailStatus, revokeGmailAuth } = require('../controllers/gmailController');

router.post('/signup', signup);
router.post('/login', login);

router.get('/gmail/authorize', verifyToken, initiateGmailAuth);
router.get('/gmail/callback', handleGmailCallback);
router.get('/gmail/status', verifyToken, checkGmailStatus);
router.post('/gmail/revoke', verifyToken, revokeGmailAuth);

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/verify', verifyToken, verifyTokenController);
router.get('/verify-token', verifyToken, verifyTokenController);

router.get('/customer-dashboard', verifyToken, authorize('customer'), (req, res) => {
    res.json({
    success: true,
     message: 'Welcome to Customer Dashboard',
      user: req.user
  });
});

router.get('/admin-dashboard', verifyToken, authorize('admin'), (req, res) => {
   res.json({
      success: true,
    message: 'Welcome to Admin Dashboard',
     user: req.user
    });
});

router.get('/hotel-dashboard', verifyToken, authorize('hotel'), (req, res) => {
  res.json({
     success: true,
      message: 'Welcome to Hotel Dashboard',
    user: req.user
   });
});

module.exports = router;
