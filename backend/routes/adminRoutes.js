const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/errors');
const validate = require('../middleware/validate');
const {
  // Dashboard
   getDashboardStats,
  
  // Hotel Management
   getHotels,
    approveHotel,
  rejectHotel,
   suspendHotel,
    unsuspendHotel,
  
   // User Management
    getUsers,
  suspendUser,
   unsuspendUser,
  
  // Monitoring
   getLowRatedHotels,
  
  // Refunds
   getRefundRequests,
    processRefund,
  
   // Reports
    getReports,
  
   // Activity Log
    getActivityLog
} = require('../controllers/adminController');

// Apply admin authentication and authorization to all routes
router.use(authenticateToken, authorizeRoles(['admin']));

// ========== DASHBOARD ==========
router.get('/dashboard/stats', asyncHandler(getDashboardStats));

// ========== HOTEL MANAGEMENT ==========
router.get('/hotels', asyncHandler(getHotels));
router.put('/hotels/:hotelId/approve', asyncHandler(approveHotel));
router.put('/hotels/:hotelId/reject', asyncHandler(rejectHotel));
router.put('/hotels/:hotelId/suspend', asyncHandler(suspendHotel));
router.put('/hotels/:hotelId/unsuspend', asyncHandler(unsuspendHotel));

// ========== USER MANAGEMENT ==========
router.get('/users', asyncHandler(getUsers));
router.put('/users/:userId/suspend', asyncHandler(suspendUser));
router.put('/users/:userId/unsuspend', asyncHandler(unsuspendUser));

// ========== PERFORMANCE MONITORING ==========
router.get('/monitoring/low-rated-hotels', asyncHandler(getLowRatedHotels));

// ========== REFUND MANAGEMENT ==========
router.get('/support/refunds', asyncHandler(getRefundRequests));
router.put('/support/refunds/:refundId/process', asyncHandler(processRefund));

// ========== REPORTS & ANALYTICS ==========
router.get('/reports', asyncHandler(getReports));

// ========== ACTIVITY LOG ==========
router.get('/activity', asyncHandler(getActivityLog));

module.exports = router;

