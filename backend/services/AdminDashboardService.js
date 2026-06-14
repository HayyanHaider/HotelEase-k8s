const BaseService = require('./BaseService');
const UserModel = require('../models/userModel');
const HotelModel = require('../models/hotelModel');
const BookingModel = require('../models/bookingModel');
const PaymentModel = require('../models/paymentModel');
const RefundRequestModel = require('../models/refundModal');

class AdminDashboardService extends BaseService {
    async getDashboardStats() {
    try {
       const [userStats, hotelStats, bookingStats, financialStats, supportStats] = await Promise.all([
          this.getUserStats(),
        this.getHotelStats(),
         this.getBookingStats(),
          this.getFinancialStats(),
        this.getSupportStats()
       ]);

      return {
         users: userStats,
          hotels: hotelStats,
        bookings: bookingStats,
         financial: financialStats,
          support: supportStats
      };
     } catch (error) {
        throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
   }

  async getUserStats() {
     const total = await UserModel.countDocuments();
      const suspended = await UserModel.countDocuments({ isSuspended: true });
    
     return {
        total,
      suspended
     };
    }

   async getHotelStats() {
      const total = await HotelModel.countDocuments();
    const pending = await HotelModel.countDocuments({ 
       isApproved: false, 
        isSuspended: false 
    });
     const approved = await HotelModel.countDocuments({ 
        isApproved: true, 
      isSuspended: false 
     });
      const suspended = await HotelModel.countDocuments({ isSuspended: true });
    const lowRated = await HotelModel.countDocuments({ 
       rating: { $lt: 2.5 }, 
        totalReviews: { $gte: 5 } 
    });

      return {
      total,
       pending,
        approved,
      suspended,
       lowRated
      };
  }

    async getBookingStats() {
    const total = await BookingModel.countDocuments();
     const active = await BookingModel.countDocuments({
        status: { $in: ['confirmed', 'pending'] },
      checkOut: { $gte: new Date() }
     });

    return {
       total,
        active
    };
   }

  async getFinancialStats() {
     const payments = await PaymentModel.find({ status: 'completed' });
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

     const currentMonth = new Date();
      currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
      const monthlyPayments = await PaymentModel.find({
      status: 'completed',
       createdAt: { $gte: currentMonth }
      });
    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

      const commissionRate = 0.10; // 10% commission
    const totalCommission = totalRevenue * commissionRate;
     const monthlyCommission = monthlyRevenue * commissionRate;

    return {
       totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
       monthlyCommission: Math.round(monthlyCommission * 100) / 100
      };
  }

    async getSupportStats() {
    try {
       const pendingRefunds = await RefundRequestModel.countDocuments({
          status: 'pending'
      }).catch(() => 0);

        return {
        openTickets: 0,
         pendingRefunds: pendingRefunds || 0
        };
    } catch (error) {
       console.error('Error getting support stats:', error);
        return {
        openTickets: 0,
         pendingRefunds: 0
        };
    }
   }
}

module.exports = new AdminDashboardService();

