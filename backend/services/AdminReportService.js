const BaseService = require('./BaseService');
const BookingModel = require('../models/bookingModel');
const PaymentModel = require('../models/paymentModel');
const HotelModel = require('../models/hotelModel');
const UserModel = require('../models/userModel');
const AdminActivityLogger = require('./AdminActivityLogger');

class AdminReportService extends BaseService {
    constructor(dependencies = {}) {
    super(dependencies);
     // Platform commission rate (10%)
      this.COMMISSION_RATE = 0.10;
  }

    async generateReport(type, adminId, { startDate, endDate }) {
    try {
       console.log(`Generating ${type} report from ${startDate} to ${endDate}`);
        const dateFilter = this._buildDateFilter(startDate, endDate);
      let reportData;

        switch (type) {
        case 'bookings':
           reportData = await this._generateBookingReport(dateFilter);
            break;
        case 'revenue':
           reportData = await this._generateRevenueReport(dateFilter);
            break;
        case 'hotels':
           reportData = await this._generateHotelReport(dateFilter);
            break;
        case 'users':
           reportData = await this._generateUserReport(dateFilter);
            break;
        case 'performance':
           reportData = await this._generatePerformanceReport(dateFilter);
            break;
        default:
           throw new Error('Invalid report type');
        }

       console.log(`Report generated successfully:`, reportData);

      await AdminActivityLogger.log(
         adminId,
          'report_generated',
        'system',
         null,
          `Generated ${type} report`,
        { reportType: type, startDate, endDate }
       );

      return reportData;
     } catch (error) {
        console.error(`Error generating ${type} report:`, error);
      throw error;
     }
    }

   async _generateBookingReport(dateFilter) {
      const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

     const totalBookings = await BookingModel.countDocuments(query);
      const bookingsByStatus = await BookingModel.aggregate([
      { $match: query },
       {
          $group: {
          _id: '$status',
           count: { $sum: 1 }
          }
      }
     ]);

    return {
       totalBookings,
        bookingsByStatus
    };
   }

  async _generateRevenueReport(dateFilter) {
     const query = Object.keys(dateFilter).length > 0
        ? { createdAt: dateFilter, status: 'completed' }
      : { status: 'completed' };

      const payments = await PaymentModel.find(query);
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
     const platformRevenue = Math.round(totalRevenue * this.COMMISSION_RATE * 100) / 100;

    const byMonth = await PaymentModel.aggregate([
       { $match: query },
        {
        $group: {
           _id: {
              year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
           },
            revenue: { $sum: '$amount' },
          count: { $sum: 1 }
         }
        },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
     ]);

    // Apply 10% commission to monthly revenue
     const byMonthWithCommission = byMonth.map(item => ({
        ...item,
      platformRevenue: Math.round(item.revenue * this.COMMISSION_RATE * 100) / 100,
       revenue: Math.round(item.revenue * 100) / 100
      }));

     return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      platformRevenue,
       byMonth: byMonthWithCommission
      };
  }

    async _generateHotelReport(dateFilter) {
    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

      const totalHotels = await HotelModel.countDocuments(query);
    const hotelsByStatus = await HotelModel.aggregate([
       { $match: query },
        {
        $group: {
           _id: {
              isApproved: '$isApproved',
            isSuspended: '$isSuspended'
           },
            count: { $sum: 1 }
        }
       }
      ]);

     const byCity = await HotelModel.aggregate([
        { $match: query },
      {
         $group: {
            _id: '$location.city',
          count: { $sum: 1 },
           avgRating: { $avg: '$rating' }
          }
      },
       { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

      // Calculate average bookings per month for approved hotels
    // Get approved hotels only
     const approvedHotels = await HotelModel.find({ ...query, isApproved: true }).select('_id');
      const approvedHotelIds = approvedHotels.map(h => h._id);

     // Total bookings for approved hotels (not limited by date filter for averaging purpose)
      const totalBookingsApprovedHotels = approvedHotelIds.length > 0
      ? await BookingModel.countDocuments({ hotelId: { $in: approvedHotelIds } })
       : 0;

    // Find first customer registration month
     const firstCustomer = await UserModel.findOne({ role: 'customer' }).sort({ createdAt: 1 }).select('createdAt');
      let monthsSinceFirstCustomer = 1;
    if (firstCustomer) {
       const start = new Date(firstCustomer.createdAt);
        const now = new Date();
      monthsSinceFirstCustomer = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
       if (monthsSinceFirstCustomer < 1) monthsSinceFirstCustomer = 1;
      }

     // Average bookings per approved hotel per month
      const avgBookingsPerApprovedHotelPerMonth = approvedHotelIds.length > 0
      ? totalBookingsApprovedHotels / (approvedHotelIds.length * monthsSinceFirstCustomer)
       : 0;

    // Revenue (still useful for summary)
     const hotelsForRevenue = await HotelModel.find(query).select('_id');
      const hotelIdsForRevenue = hotelsForRevenue.map(h => h._id);
    const revenueBookingQuery = hotelIdsForRevenue.length > 0 ? { hotelId: { $in: hotelIdsForRevenue } } : {};
     if (Object.keys(dateFilter).length > 0) {
        revenueBookingQuery.createdAt = dateFilter;
    }
     const bookingsForRevenue = await BookingModel.find(revenueBookingQuery);
      const totalRevenue = bookingsForRevenue.reduce((sum, b) => sum + b.totalPrice, 0);

     return {
        totalHotels,
      hotelsByStatus,
       topCities: byCity,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgBookingsPerApprovedHotelPerMonth: Math.round(avgBookingsPerApprovedHotelPerMonth * 100) / 100
     };
    }

   async _generateUserReport(dateFilter) {
      const query = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter, role: 'customer' } 
       : { role: 'customer' };

    const totalCustomers = await UserModel.countDocuments(query);
    
      // Get all customers
    const customers = await UserModel.find(query).select('_id createdAt').sort({ createdAt: 1 });
    
      // Calculate average customers per month starting from first customer registration
    let avgCustomersPerMonth = 0;
     if (customers.length > 0) {
        const firstCustomerDate = new Date(customers[0].createdAt);
      const currentDate = new Date();
      
        // Calculate months from first customer to now
      const monthsDiff = (currentDate.getFullYear() - firstCustomerDate.getFullYear()) * 12 
         + (currentDate.getMonth() - firstCustomerDate.getMonth()) + 1;
      
      avgCustomersPerMonth = monthsDiff > 0 ? totalCustomers / monthsDiff : totalCustomers;
     }

    // Get bookings for these customers
     const customerIds = customers.map(c => c._id);
      const totalBookings = await BookingModel.countDocuments({ 
      userId: { $in: customerIds } 
     });
    
    // Calculate average bookings per customer
     const avgBookingsPerCustomer = totalCustomers > 0 ? totalBookings / totalCustomers : 0;

    // Get customer registration trend by month
     const customersByMonth = await UserModel.aggregate([
        { $match: query },
      {
         $group: {
            _id: {
            year: { $year: '$createdAt' },
             month: { $month: '$createdAt' }
            },
          count: { $sum: 1 }
         }
        },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
     ]);

    return {
       totalCustomers,
        totalBookings,
      avgCustomersPerMonth: Math.round(avgCustomersPerMonth * 100) / 100,
       avgBookingsPerCustomer: Math.round(avgBookingsPerCustomer * 100) / 100,
        customersByMonth
    };
   }

  async _generatePerformanceReport(dateFilter) {
     const matchQuery = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Top performing hotels by revenue
     const topHotels = await BookingModel.aggregate([
        { $match: matchQuery },
      {
         $group: {
            _id: '$hotelId',
          totalRevenue: { $sum: '$totalPrice' },
           bookingCount: { $sum: 1 }
          }
      },
       { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      {
         $lookup: {
            from: 'hotels',
          localField: '_id',
           foreignField: '_id',
            as: 'hotel'
        }
       },
        { $unwind: '$hotel' }
    ]);

      // Apply 10% commission to top hotels revenue
    const topHotelsWithCommission = topHotels.map(item => ({
       ...item,
        platformRevenue: Math.round(item.totalRevenue * this.COMMISSION_RATE * 100) / 100,
      totalRevenue: Math.round(item.totalRevenue * 100) / 100
     }));

    // Worst rated hotels
     const worstRated = await HotelModel.find({ totalReviews: { $gte: 5 } })
        .sort({ rating: 1 })
      .limit(10)
       .select('name rating totalReviews location');

    return {
       topPerformingHotels: topHotelsWithCommission,
        worstRatedHotels: worstRated
    };
   }

  _buildDateFilter(startDate, endDate) {
     const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
     return dateFilter;
    }
}

module.exports = new AdminReportService();

