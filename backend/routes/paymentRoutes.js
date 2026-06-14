const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Protected routes - Customer only
router.post('/process', authenticateToken, authorizeRoles(['customer']), paymentController.processPayment);
router.get('/history', authenticateToken, authorizeRoles(['customer']), paymentController.getPaymentHistory);
router.get('/invoice/:bookingId', authenticateToken, authorizeRoles(['customer']), paymentController.downloadInvoice);
router.get('/:paymentId', authenticateToken, authorizeRoles(['customer']), paymentController.getPaymentById);

module.exports = router;
