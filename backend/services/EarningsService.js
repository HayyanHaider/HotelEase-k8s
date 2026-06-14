const BaseService = require('./BaseService');
const BookingRepository = require('../repositories/BookingRepository');
const HotelRepository = require('../repositories/HotelRepository');
const PaymentRepository = require('../repositories/PaymentRepository');

class EarningsService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.bookingRepository = dependencies.bookingRepository || BookingRepository;
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
    this.paymentRepository = dependencies.paymentRepository || PaymentRepository;
  }

  #calculateDateRange(period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return startDate;
  }

  #calculateNetEarnings(grossAmount, commissionRate = 0.10) {
    return grossAmount;
  }

  async getEarningsDashboard(ownerId, period = 'month') {
    try {
      // Get all hotels owned by this owner (excluding suspended hotels)
      const hotels = await this.hotelRepository.find({ 
        ownerId, 
        isSuspended: { $ne: true } 
      });

      const hotelIds = hotels.map(h => h._id);

      if (hotelIds.length === 0) {
        return {
          totalEarnings: 0,
          totalBookings: 0,
          averageBookingValue: 0,
          periodEarnings: 0,
          periodBookings: 0,
          hotels: []
        };
      }

      // Calculate date range
      const startDate = this.#calculateDateRange(period);

      // Get all bookings for owner's hotels
      const allBookings = await this.bookingRepository.find({
        hotelId: { $in: hotelIds },
        status: { $in: ['checked-in', 'checked-out', 'completed'] }
      });

      const totalEarnings = allBookings.reduce((sum, booking) => {
        if (booking && booking.hotelId) {
          const hotelIdStr = booking.hotelId._id ? String(booking.hotelId._id) : String(booking.hotelId);
          const hotel = hotels.find(h => String(h._id) === hotelIdStr);
          const commissionRate = hotel ? (hotel.commissionRate || 0.10) : 0.10;
          const discountedTotal = booking.priceSnapshot?.totalPrice || booking.totalPrice || 0;
          return sum + this.#calculateNetEarnings(discountedTotal, commissionRate);
        }
        return sum;
      }, 0);

      const periodBookings = allBookings.filter(booking => {
        const checkInDate = booking.checkedInAt ? new Date(booking.checkedInAt) : new Date(booking.updatedAt);
        return checkInDate >= startDate;
      });

      const periodEarnings = periodBookings.reduce((sum, booking) => {
        if (booking && booking.hotelId) {
          const hotelIdStr = booking.hotelId._id ? String(booking.hotelId._id) : String(booking.hotelId);
          const hotel = hotels.find(h => String(h._id) === hotelIdStr);
          const commissionRate = hotel ? (hotel.commissionRate || 0.10) : 0.10;
          const discountedTotal = booking.priceSnapshot?.totalPrice || booking.totalPrice || 0;
          return sum + this.#calculateNetEarnings(discountedTotal, commissionRate);
        }
        return sum;
      }, 0);

      const hotelEarnings = hotels.map(hotel => {
        const hotelBookings = allBookings.filter(b => {
          const bookingHotelId = b.hotelId?._id ? String(b.hotelId._id) : String(b.hotelId || b.hotel);
          return bookingHotelId === String(hotel._id);
        });

        const hotelNetEarnings = hotelBookings.reduce((sum, booking) => {
          const commissionRate = hotel.commissionRate || 0.10;
          const discountedTotal = booking?.priceSnapshot?.totalPrice || booking?.totalPrice || 0;
          return sum + this.#calculateNetEarnings(discountedTotal, commissionRate);
        }, 0);

        const hotelPeriodBookings = hotelBookings.filter(booking => {
          const checkInDate = booking.checkedInAt ? new Date(booking.checkedInAt) : new Date(booking.updatedAt);
          return checkInDate >= startDate;
        });
        
        const hotelPeriodEarnings = hotelPeriodBookings.reduce((sum, booking) => {
          const commissionRate = hotel.commissionRate || 0.10;
          const discountedTotal = booking?.priceSnapshot?.totalPrice || booking?.totalPrice || 0;
          return sum + this.#calculateNetEarnings(discountedTotal, commissionRate);
        }, 0);

        return {
          hotelId: hotel._id,
          hotelName: hotel.name,
          totalBookings: hotelBookings.length,
          totalEarnings: hotelNetEarnings.toFixed(2),
          periodEarnings: hotelPeriodEarnings.toFixed(2),
          averageBookingValue: hotelBookings.length > 0 
            ? (hotelNetEarnings / hotelBookings.length).toFixed(2)
            : '0.00'
        };
      });

      const totalBookings = allBookings.length;
      const periodBookingsCount = periodBookings.length;

      const averageBookingValue = totalBookings > 0 ? totalEarnings / totalBookings : 0;

      return {
        totalEarnings: totalEarnings.toFixed(2),
        totalBookings,
        averageBookingValue: averageBookingValue.toFixed(2),
        periodEarnings: periodEarnings.toFixed(2),
        periodBookings: periodBookingsCount,
        period,
        hotels: hotelEarnings
      };
    } catch (error) {
      this.handleError(error, 'Get earnings dashboard');
    }
  }

  async getEarningsByHotel(ownerId, hotelId, period = 'month') {
    try {
      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: hotelId, ownerId });
      if (!hotel) {
        throw new Error('Hotel not found or you do not have permission');
      }

      // Calculate date range
      const startDate = this.#calculateDateRange(period);

      const bookings = await this.bookingRepository.find({
        hotelId: hotelId,
        status: { $in: ['checked-in', 'checked-out', 'completed'] }
      });

      const totalEarnings = bookings.reduce((sum, booking) => {
        const commissionRate = hotel.commissionRate || 0.10;
        const discountedTotal = booking?.priceSnapshot?.totalPrice || booking?.totalPrice || 0;
        return sum + this.#calculateNetEarnings(discountedTotal, commissionRate);
      }, 0);

      const periodBookings = bookings.filter(booking => {
        const checkInDate = booking.checkedInAt ? new Date(booking.checkedInAt) : new Date(booking.updatedAt);
        return checkInDate >= startDate;
      });

      const periodEarnings = periodBookings.reduce((sum, booking) => {
        const commissionRate = hotel.commissionRate || 0.10;
        const discountedTotal = booking?.priceSnapshot?.totalPrice || booking?.totalPrice || 0;
        return sum + this.#calculateNetEarnings(discountedTotal, commissionRate);
      }, 0);

      return {
        hotelId: hotel._id,
        hotelName: hotel.name,
        totalBookings: bookings.length,
        totalEarnings: totalEarnings.toFixed(2),
        periodEarnings: periodEarnings.toFixed(2),
        periodBookings: periodBookings.length,
        averageBookingValue: bookings.length > 0 
          ? (totalEarnings / bookings.length).toFixed(2)
          : '0.00',
        commissionRate: hotel.commissionRate || 0.10
      };
    } catch (error) {
      this.handleError(error, 'Get earnings by hotel');
    }
  }
}

module.exports = new EarningsService();

