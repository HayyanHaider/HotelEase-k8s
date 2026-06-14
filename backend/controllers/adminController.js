const AdminDashboardService = require('../services/AdminDashboardService');
const AdminHotelService = require('../services/AdminHotelService');
const AdminUserService = require('../services/AdminUserService');
const AdminReportService = require('../services/AdminReportService');
const AdminActivityLogger = require('../services/AdminActivityLogger');
const RefundModel = require('../models/refundModal');
const PaymentModel = require('../models/paymentModel');

class AdminController {
  async getDashboardStats(req, res) {
     try {
        const stats = await AdminDashboardService.getDashboardStats();
      res.json({ success: true, stats });
     } catch (error) {
        console.error('getDashboardStats error:', error);
      res.status(500).json({
         success: false,
          message: 'Server error while fetching dashboard stats'
      });
     }
    }

   async getHotels(req, res) {
      try {
      const { status, search, page, limit } = req.query;
       const result = await AdminHotelService.getHotels({
          status,
        search,
         page,
          limit
      });

        res.json({
        success: true,
         hotels: result.hotels,
          pagination: result.pagination
      });
     } catch (error) {
        console.error('getHotels error:', error);
      res.status(500).json({
         success: false,
          message: 'Server error while fetching hotels'
      });
     }
    }

   async approveHotel(req, res) {
      try {
      const { hotelId } = req.params;
       const adminId = req.user.userId;

      const hotel = await AdminHotelService.approveHotel(hotelId, adminId);
       res.json({ success: true, hotel });
      } catch (error) {
      console.error('approveHotel error:', error);
       res.status(error.message === 'Hotel not found' ? 404 : 500).json({
          success: false,
        message: error.message
       });
      }
  }

    async rejectHotel(req, res) {
    try {
       const { hotelId } = req.params;
        const { reason = '' } = req.body;
      const adminId = req.user.userId;

        const hotel = await AdminHotelService.rejectHotel(hotelId, adminId, reason);
      res.json({ success: true, hotel });
     } catch (error) {
        console.error('rejectHotel error:', error);
      res.status(error.message === 'Hotel not found' ? 404 : 500).json({
         success: false,
          message: error.message
      });
     }
    }

   async suspendHotel(req, res) {
      try {
      const { hotelId } = req.params;
       const { reason = '' } = req.body;
        const adminId = req.user.userId;

       const hotel = await AdminHotelService.suspendHotel(hotelId, adminId, reason);
        res.json({ success: true, hotel });
    } catch (error) {
       console.error('suspendHotel error:', error);
        res.status(error.message === 'Hotel not found' ? 404 : 500).json({
        success: false,
         message: error.message
        });
    }
   }

  async unsuspendHotel(req, res) {
     try {
        const { hotelId } = req.params;
      const adminId = req.user.userId;

        const hotel = await AdminHotelService.unsuspendHotel(hotelId, adminId);
      res.json({ success: true, hotel });
     } catch (error) {
        console.error('unsuspendHotel error:', error);
      res.status(error.message === 'Hotel not found' ? 404 : 500).json({
         success: false,
          message: error.message
      });
     }
    }

   async getUsers(req, res) {
      try {
      const { role, status, search, page, limit } = req.query;
       const result = await AdminUserService.getUsers({
          role,
        status,
         search,
          page,
        limit
       });

      res.json({
         success: true,
          users: result.users,
        pagination: result.pagination
       });
      } catch (error) {
      console.error('getUsers error:', error);
       res.status(500).json({
          success: false,
        message: 'Server error while fetching users'
       });
      }
  }

    async suspendUser(req, res) {
    try {
       const { userId } = req.params;
        const { reason = '' } = req.body;
      const adminId = req.user.userId;

        const user = await AdminUserService.suspendUser(userId, adminId, reason);
      res.json({ success: true, user });
     } catch (error) {
        console.error('suspendUser error:', error);
      res.status(error.message === 'User not found' ? 404 : 500).json({
         success: false,
          message: error.message
      });
     }
    }

   async unsuspendUser(req, res) {
      try {
      const { userId } = req.params;
       const adminId = req.user.userId;

      const user = await AdminUserService.unsuspendUser(userId, adminId);
       res.json({ success: true, user });
      } catch (error) {
      console.error('unsuspendUser error:', error);
       res.status(error.message === 'User not found' ? 404 : 500).json({
          success: false,
        message: error.message
       });
      }
  }

    async getLowRatedHotels(req, res) {
    try {
       const { page, limit } = req.query;
        const result = await AdminHotelService.getLowRatedHotels({ page, limit });

       res.json({
          success: true,
        hotels: result.hotels,
         pagination: result.pagination
        });
    } catch (error) {
       console.error('getLowRatedHotels error:', error);
        res.status(500).json({
        success: false,
         message: 'Server error while fetching low-rated hotels'
        });
    }
   }

  async getRefundRequests(req, res) {
     try {
        const { status, page = 1, limit = 50 } = req.query;
      const skip = (page - 1) * limit;
       const query = status ? { status } : {};

      const [refunds, total] = await Promise.all([
         RefundModel.find(query)
            .populate('userId', 'name email phone')
          .populate('bookingId')
           .populate('processedBy', 'name email')
            .sort({ requestedAt: -1 })
          .limit(parseInt(limit))
           .skip(skip),
          RefundModel.countDocuments(query)
      ]);

        res.json({
        success: true,
         refunds,
          pagination: {
          total,
           page: parseInt(page),
            limit: parseInt(limit),
          pages: Math.ceil(total / limit)
         }
        });
    } catch (error) {
       console.error('getRefundRequests error:', error);
        res.status(500).json({
        success: false,
         message: 'Server error while fetching refund requests'
        });
    }
   }

  async processRefund(req, res) {
     try {
        const { refundId } = req.params;
      const { action, notes = '' } = req.body;
       const adminId = req.user.userId;

      if (!['approve', 'reject'].includes(action)) {
         return res.status(400).json({ success: false, message: 'Invalid action. Must be "approve" or "reject"' });
        }

       const updateData = {
          status: action === 'approve' ? 'approved' : 'rejected',
        adminNotes: notes,
         processedBy: adminId,
          processedAt: new Date()
      };

        const refund = await RefundModel.findByIdAndUpdate(
        refundId,
         updateData,
          { new: true }
      ).populate('userId bookingId');

        if (!refund) {
        return res.status(404).json({ success: false, message: 'Refund request not found' });
       }

      if (action === 'approve') {
         await PaymentModel.findByIdAndUpdate(refund.paymentId, {
            refundStatus: 'refunded',
          refundedAt: new Date()
         });
        }

       await AdminActivityLogger.log(
          adminId,
        action === 'approve' ? 'refund_approved' : 'refund_rejected',
         'refund',
          refundId,
        `${action === 'approve' ? 'Approved' : 'Rejected'} refund of $${refund.amount} for ${refund.userId?.name}`,
         { amount: refund.amount, userName: refund.userId?.name, notes }
        );

       res.json({ success: true, refund });
      } catch (error) {
      console.error('processRefund error:', error);
       const status = error.message.includes('not found') ? 404 :
          error.message.includes('Invalid') ? 400 : 500;
      res.status(status).json({
         success: false,
          message: error.message
      });
     }
    }

   async getReports(req, res) {
      try {
      const { type, startDate, endDate } = req.query;
       const adminId = req.user.userId;

      const report = await AdminReportService.generateReport(
         type,
          adminId,
        { startDate, endDate }
       );

      res.json({ success: true, report });
     } catch (error) {
        console.error('getReports error:', error);
      const status = error.message === 'Invalid report type' ? 400 : 500;
       res.status(status).json({
          success: false,
        message: error.message
       });
      }
  }

    async getActivityLog(req, res) {
    try {
       const { action, targetType, page, limit } = req.query;
        const result = await AdminActivityLogger.getActivities({
        action,
         targetType,
          page,
        limit
       });

      res.json({
         success: true,
          activities: result.activities,
        pagination: result.pagination
       });
      } catch (error) {
      console.error('getActivityLog error:', error);
       res.status(500).json({
          success: false,
        message: 'Server error while fetching activity log'
       });
      }
  }
}

const controller = new AdminController();

module.exports = {
  getDashboardStats: (req, res) => controller.getDashboardStats(req, res),
   getHotels: (req, res) => controller.getHotels(req, res),
    approveHotel: (req, res) => controller.approveHotel(req, res),
  rejectHotel: (req, res) => controller.rejectHotel(req, res),
   suspendHotel: (req, res) => controller.suspendHotel(req, res),
    unsuspendHotel: (req, res) => controller.unsuspendHotel(req, res),
  getUsers: (req, res) => controller.getUsers(req, res),
   suspendUser: (req, res) => controller.suspendUser(req, res),
    unsuspendUser: (req, res) => controller.unsuspendUser(req, res),
  getLowRatedHotels: (req, res) => controller.getLowRatedHotels(req, res),
   getRefundRequests: (req, res) => controller.getRefundRequests(req, res),
    processRefund: (req, res) => controller.processRefund(req, res),
  getReports: (req, res) => controller.getReports(req, res),
   getActivityLog: (req, res) => controller.getActivityLog(req, res)
};
