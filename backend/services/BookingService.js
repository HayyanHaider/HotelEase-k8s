const BaseService = require('./BaseService');
const IBookingService = require('./interfaces/IBookingService');
const BookingRepository = require('../repositories/BookingRepository');
const HotelRepository = require('../repositories/HotelRepository');
const CustomerRepository = require('../repositories/CustomerRepository');
const CouponRepository = require('../repositories/CouponRepository');
const UserRepository = require('../repositories/UserRepository');
const Coupon = require('../classes/Coupon');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/pdfService');
const { uploadInvoiceToCloudinary, hasCloudinaryConfig } = require('../utils/cloudinaryInvoiceService');
const path = require('path');
const fs = require('fs');

class BookingService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.bookingRepository = dependencies.bookingRepository || BookingRepository;
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
    this.customerRepository = dependencies.customerRepository || CustomerRepository;
    this.couponRepository = dependencies.couponRepository || CouponRepository;
    this.userRepository = dependencies.userRepository || UserRepository;
  }

  #normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  async #checkRoomAvailability(hotelId, totalRooms, checkIn, checkOut, excludeBookingId = null) {
    const overlappingBookings = await this.bookingRepository.findOverlapping(
      hotelId,
      checkIn,
      checkOut,
      ['cancelled', 'pending']
    );

    const bookingsToCheck = excludeBookingId
      ? overlappingBookings.filter(b => String(b._id) !== String(excludeBookingId))
      : overlappingBookings;

    const checkInTime = this.#normalizeDate(checkIn);
    const checkOutTime = this.#normalizeDate(checkOut);

    for (let date = new Date(checkInTime); date < checkOutTime; date.setDate(date.getDate() + 1)) {
      const currentDate = this.#normalizeDate(date);
      
      const bookingsOnThisDay = bookingsToCheck.filter(booking => {
        const bookingCheckIn = this.#normalizeDate(booking.checkIn);
        const bookingCheckOut = this.#normalizeDate(booking.checkOut);
        return currentDate >= bookingCheckIn && currentDate < bookingCheckOut;
      });
      
      const roomsBookedOnThisDay = bookingsOnThisDay.length;
      
      if (roomsBookedOnThisDay >= totalRooms) {
        return {
          available: false,
          date: currentDate.toLocaleDateString()
        };
      }
    }

    return { available: true };
  }

  #calculatePrice(hotel, nights, appliedCoupon = null) {
    const basePrice = hotel.pricing?.basePrice || 0;
    const cleaningFee = hotel.pricing?.cleaningFee || 0;
    const serviceFee = hotel.pricing?.serviceFee || 0;
    const subtotal = (basePrice * nights) + cleaningFee + serviceFee;
    const taxes = 0;
    
    let discounts = 0;
    if (appliedCoupon && appliedCoupon.discountPercentage) {
      // Calculate discount directly - coupon already validated in #findAndApplyCoupon
      discounts = subtotal * (appliedCoupon.discountPercentage / 100);
    }
    
    const totalPrice = subtotal + taxes - discounts;

    return {
      basePrice,
      cleaningFee,
      serviceFee,
      subtotal,
      taxes,
      discounts,
      totalPrice
    };
  }

  async #findAndApplyCoupon(hotelId, couponCode = null) {
    let couponDoc = null;

    if (couponCode) {
      // Find coupon by code
      couponDoc = await this.couponRepository.findByCode(couponCode.toUpperCase());
      
      // Verify it belongs to this hotel
      if (!couponDoc || String(couponDoc.hotelId) !== String(hotelId)) {
        throw new Error(`Coupon code "${couponCode}" not found or not valid for this hotel`);
      }
    } else {
      // If no code provided, find first available coupon for hotel
      const now = new Date();
      const availableCoupons = await this.couponRepository.findActive(
        { hotelId },
        { sort: { createdAt: 1 } }
      );

      if (availableCoupons.length === 0) {
        return null;
      }

      couponDoc = availableCoupons[0];
    }
    
    // Check if coupon has reached max uses
    if (couponDoc.maxUses && couponDoc.currentUses >= couponDoc.maxUses) {
      throw new Error(`Coupon code "${couponDoc.code}" has reached its maximum usage limit`);
    }

    // Check if coupon is active
    if (!couponDoc.isActive) {
      throw new Error(`Coupon code "${couponDoc.code}" is not active`);
    }

    const couponData = {
      id: couponDoc._id,
      hotelId: couponDoc.hotelId,
      code: couponDoc.code,
      discountPercentage: couponDoc.discountPercentage,
      validFrom: couponDoc.validFrom,
      validTo: couponDoc.validTo,
      maxUses: couponDoc.maxUses
    };

    const couponInstance = new Coupon(couponData);
    if (!couponInstance.isValid()) {
      throw new Error(`Coupon code "${couponDoc.code}" is not valid (expired or not yet active)`);
    }

    await this.couponRepository.incrementUsage(couponDoc._id);

    return {
      id: couponDoc._id,
      hotelId: couponDoc.hotelId,
      code: couponDoc.code,
      discountPercentage: couponDoc.discountPercentage,
      validFrom: couponDoc.validFrom,
      validTo: couponDoc.validTo,
      maxUses: couponDoc.maxUses,
      currentUses: couponDoc.currentUses,
      isActive: couponDoc.isActive,
      discountAmount: 0
    };
  }

  async createBooking(bookingData, userId) {
    try {
      this.validateRequired(bookingData, ['hotelId', 'checkInDate', 'checkOutDate', 'guests']);

      const customerDoc = await this.customerRepository.findOrCreateByUser(userId);
      const customerId = customerDoc._id;

      const hotel = await this.hotelRepository.findById(bookingData.hotelId);
      if (!hotel) {
        throw new Error('Hotel not found');
      }

      if (!hotel.isApproved) {
        throw new Error('Hotel is not approved yet');
      }
      if (hotel.isSuspended) {
        throw new Error('Hotel is currently suspended');
      }

      const maxGuests = hotel.capacity?.guests || 1;
      if (parseInt(bookingData.guests) > maxGuests) {
        throw new Error(`Hotel can only accommodate ${maxGuests} guests`);
      }

      const checkIn = this.#normalizeDate(new Date(bookingData.checkInDate));
      const checkOut = this.#normalizeDate(new Date(bookingData.checkOutDate));
      const today = this.#normalizeDate(new Date());

      if (checkIn >= checkOut) {
        throw new Error('Check-out date must be after check-in date');
      }
      if (checkIn < today) {
        throw new Error('Check-in date cannot be in the past');
      }

      const daysDiff = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
      const nights = Math.max(1, Math.floor(daysDiff));

      const totalRooms = hotel.totalRooms || 1;
      const availability = await this.#checkRoomAvailability(
        bookingData.hotelId,
        totalRooms,
        checkIn,
        checkOut
      );

      if (!availability.available) {
        throw new Error(`Hotel is fully booked on ${availability.date}. Only ${totalRooms} room(s) available.`);
      }

      // Find and apply coupon if couponCode is provided
      let appliedCoupon = null;
      if (bookingData.couponCode) {
        try {
          appliedCoupon = await this.#findAndApplyCoupon(bookingData.hotelId, bookingData.couponCode);
        } catch (couponError) {
          // If coupon is invalid, continue without coupon (don't fail the booking)
          console.warn('Coupon application failed:', couponError.message);
        }
      } else {
        // Try to auto-apply first available coupon if no code provided
        appliedCoupon = await this.#findAndApplyCoupon(bookingData.hotelId);
      }
      
      const priceData = this.#calculatePrice(hotel, nights, appliedCoupon);
      
      if (appliedCoupon) {
        appliedCoupon.discountAmount = priceData.discounts;
      }

      const bookingDoc = await this.bookingRepository.create({
        userId: customerId,
        hotelId: bookingData.hotelId,
        couponId: appliedCoupon?.id || null,
        checkIn,
        checkOut,
        nights,
        guests: parseInt(bookingData.guests),
        taxes: priceData.taxes,
        discounts: priceData.discounts,
        totalPrice: priceData.totalPrice,
        status: 'pending',
        priceSnapshot: {
          basePricePerDay: priceData.basePrice,
          nights: nights,
          basePriceTotal: priceData.basePrice * nights,
          cleaningFee: priceData.cleaningFee,
          serviceFee: priceData.serviceFee,
          subtotal: priceData.subtotal,
          taxes: priceData.taxes,
          discounts: priceData.discounts,
          totalPrice: priceData.totalPrice,
          couponCode: appliedCoupon?.code || null,
          couponDiscountPercentage: appliedCoupon?.discountPercentage || null
        }
      });

      const booking = await this.bookingRepository.findById(bookingDoc._id, {
        populate: [
          { path: 'hotelId', select: 'name location' },
          { path: 'couponId', select: 'code discountPercentage' }
        ]
      });

      return {
        booking,
        appliedCoupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discountPercentage: appliedCoupon.discountPercentage,
          discountAmount: appliedCoupon.discountAmount
        } : null
      };
    } catch (error) {
      this.handleError(error, 'Create booking');
    }
  }

  async getUserBookings(userId, filters = {}) {
    try {
      const customerDoc = await this.customerRepository.findOrCreateByUser(userId);
      const customerId = customerDoc._id;

      const query = { userId: customerId };
      
      if (filters.status) {
        query.status = filters.status;
      } else {
        query.status = { $ne: 'pending' };
      }

      const options = {
        populate: [
          {
            path: 'hotelId',
            select: 'name location isSuspended',
            match: { isSuspended: { $ne: true } }
          }
        ],
        sort: { createdAt: -1 },
        limit: parseInt(filters.limit) || 10,
        skip: ((parseInt(filters.page) || 1) - 1) * (parseInt(filters.limit) || 10)
      };

      const bookings = await this.bookingRepository.find(query, options);

      const filteredBookings = bookings.filter(booking => 
        booking.hotelId !== null && booking.status !== 'pending'
      );

      const ReviewRepository = require('../repositories/ReviewRepository');
      const bookingsWithReviews = await Promise.all(
        filteredBookings.map(async (booking) => {
          const reviewData = await ReviewRepository.findByBooking(booking._id || booking.id);
          let review = null;
          if (reviewData) {
            const populatedReview = await ReviewRepository.model.findById(reviewData._id || reviewData.id)
              .populate('userId', 'email name')
              .lean();
            review = populatedReview ? {
              _id: populatedReview._id || populatedReview.id,
              rating: populatedReview.rating,
              comment: populatedReview.comment,
              reply: populatedReview.reply,
              replyText: populatedReview.replyText,
              repliedAt: populatedReview.repliedAt,
              createdAt: populatedReview.createdAt,
              userId: populatedReview.userId
            } : null;
          }
          const bookingObj = booking.toObject ? booking.toObject() : booking;
          return {
            ...bookingObj,
            review
          };
        })
      );

      return {
        count: bookingsWithReviews.length,
        bookings: bookingsWithReviews
      };
    } catch (error) {
      this.handleError(error, 'Get user bookings');
    }
  }

  async getBookingById(bookingId, userId) {
    try {
      const customerDoc = await this.customerRepository.findOrCreateByUser(userId);
      const customerId = customerDoc._id;

      const booking = await this.bookingRepository.findOne(
        { _id: bookingId, userId: customerId },
        {
          populate: [
            {
              path: 'hotelId',
              select: 'name location contactInfo isSuspended',
              match: { isSuspended: { $ne: true } }
            },
            { path: 'couponId', select: 'code discountPercentage' }
          ]
        }
      );

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (!booking.hotelId) {
        throw new Error('Booking not found or hotel is suspended');
      }

      return booking;
    } catch (error) {
      this.handleError(error, 'Get booking by ID');
    }
  }

  async cancelBooking(bookingId, userId, reason = '') {
    try {
      const customerDoc = await this.customerRepository.findByUser(userId);
      if (!customerDoc) {
        throw new Error('Customer profile not found');
      }
      const customerId = customerDoc._id;

      const booking = await this.bookingRepository.findOne({ _id: bookingId, userId: customerId });
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'pending') {
        if (booking.couponId) {
          await this.couponRepository.decrementUsage(booking.couponId);
        }

        await this.bookingRepository.deleteById(bookingId);

        this.#sendCancellationEmail(bookingId, userId, null).catch(err => 
          console.error('Error sending cancellation email:', err)
        );

        return { message: 'Pending booking removed successfully' };
      }

      if (booking.status === 'confirmed') {
        const hoursUntilCheckIn = (new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60);
        if (hoursUntilCheckIn <= 24) {
          throw new Error('Cannot cancel within 24 hours of check-in');
        }
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      if (booking.status === 'completed' || booking.status === 'checked-out') {
        throw new Error('Cannot cancel a completed booking');
      }

      if (booking.couponId && booking.status === 'confirmed') {
        await this.couponRepository.decrementUsage(booking.couponId);
      }

      const refundAmount = booking.priceSnapshot?.totalPrice || booking.totalPrice;

      await this.bookingRepository.updateById(bookingId, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationPolicyApplied: '24h-before-check-in',
        cancellationFee: 0,
        refundAmount: refundAmount
      });

      this.#sendCancellationEmail(bookingId, userId, refundAmount).catch(err => 
        console.error('Error sending cancellation email:', err)
      );

      return { message: 'Booking cancelled successfully' };
    } catch (error) {
      this.handleError(error, 'Cancel booking');
    }
  }

  async rescheduleBooking(bookingId, userId, newDates) {
    try {
      this.validateRequired(newDates, ['checkInDate', 'checkOutDate']);

      const customerDoc = await this.customerRepository.findByUser(userId);
      if (!customerDoc) {
        throw new Error('Customer profile not found');
      }
      const customerId = customerDoc._id;

      const booking = await this.bookingRepository.findOne(
        { _id: bookingId, userId: customerId },
        { populate: [{ path: 'hotelId' }] }
      );

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        throw new Error('Can only reschedule pending or confirmed bookings');
      }

      const newCheckIn = this.#normalizeDate(new Date(newDates.checkInDate));
      const newCheckOut = this.#normalizeDate(new Date(newDates.checkOutDate));
      const today = this.#normalizeDate(new Date());

      if (newCheckIn >= newCheckOut) {
        throw new Error('Check-out date must be after check-in date');
      }
      if (newCheckIn < today) {
        throw new Error('Check-in date cannot be in the past');
      }

      const daysDiff = (newCheckOut - newCheckIn) / (1000 * 60 * 60 * 24);
      const newNights = Math.max(1, Math.floor(daysDiff));

      const hotel = booking.hotelId;
      const totalRooms = hotel.totalRooms || 1;
      const availability = await this.#checkRoomAvailability(
        hotel._id,
        totalRooms,
        newCheckIn,
        newCheckOut,
        bookingId
      );

      if (!availability.available) {
        throw new Error(`Hotel is fully booked on ${availability.date}. Please choose different dates.`);
      }

      const basePrice = booking.priceSnapshot?.basePricePerDay || hotel.pricing?.basePrice || 0;
      const cleaningFee = booking.priceSnapshot?.cleaningFee || hotel.pricing?.cleaningFee || 0;
      const serviceFee = booking.priceSnapshot?.serviceFee || hotel.pricing?.serviceFee || 0;
      const subtotal = (basePrice * newNights) + cleaningFee + serviceFee;
      
      let discounts = 0;
      if (booking.couponId && booking.priceSnapshot?.couponDiscountPercentage) {
        discounts = subtotal * (booking.priceSnapshot.couponDiscountPercentage / 100);
      }
      
      const newTotalPrice = subtotal - discounts;

      await this.bookingRepository.updateById(bookingId, {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        nights: newNights,
        totalPrice: newTotalPrice,
        discounts: discounts,
        'priceSnapshot.nights': newNights,
        'priceSnapshot.basePriceTotal': basePrice * newNights,
        'priceSnapshot.subtotal': subtotal,
        'priceSnapshot.discounts': discounts,
        'priceSnapshot.totalPrice': newTotalPrice
      });

      const updatedBooking = await this.bookingRepository.findById(bookingId, {
        populate: [
          { path: 'hotelId', select: 'name location' },
          { path: 'couponId', select: 'code discountPercentage' }
        ]
      });

      this.#sendRescheduleEmail(bookingId, userId, booking, updatedBooking).catch(err =>
        console.error('Error sending reschedule email:', err)
      );

      if (booking.invoicePath) {
        this.#regenerateInvoice(bookingId, userId, updatedBooking, newCheckIn, newCheckOut, newNights)
          .catch(err => console.error('Error regenerating invoice:', err));
      }

      return {
        message: 'Booking rescheduled successfully',
        booking: updatedBooking
      };
    } catch (error) {
      this.handleError(error, 'Reschedule booking');
    }
  }

  async #sendCancellationEmail(bookingId, userId, refundAmount) {
    try {
      const booking = await this.bookingRepository.findById(bookingId, {
        populate: [
          { path: 'hotelId', select: 'name location address' },
          { path: 'couponId', select: 'code discountPercentage' }
        ]
      });

      const user = await this.userRepository.findById(userId);

      if (user && booking && booking.hotelId) {
        const emailTemplate = emailTemplates.cancellationEmail(
          booking,
          booking.hotelId,
          { name: user.name, email: user.email },
          refundAmount
        );

        await sendEmail(
          user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text,
          {
            userId: userId,
            useUserGmail: true
          }
        );

        console.log(`✅ Cancellation email sent to customer: ${user.email}`);
      }
    } catch (error) {
      console.error('Error sending cancellation email:', error);
    }
  }

  async #sendRescheduleEmail(bookingId, userId, oldBooking, newBooking) {
    try {
      const user = await this.userRepository.findById(userId);
      if (user && newBooking && newBooking.hotelId) {
        const emailTemplate = emailTemplates.rescheduleEmail(
          newBooking,
          newBooking.hotelId,
          { name: user.name, email: user.email },
          oldBooking.checkIn,
          oldBooking.checkOut,
          oldBooking.nights || 1
        );

        await sendEmail(
          user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text,
          {
            userId: userId,
            useUserGmail: true
          }
        );

        console.log(`✅ Reschedule email sent to customer: ${user.email}`);
      }
    } catch (error) {
      console.error('Error sending reschedule email:', error);
    }
  }

  async #regenerateInvoice(bookingId, userId, booking, checkIn, checkOut, nights) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return;
      }

      const PaymentModel = require('../models/paymentModel');
      const payment = await PaymentModel.findOne({ bookingId: bookingId, status: 'completed' })
        .sort({ createdAt: -1 });

      const invoiceDir = path.join(__dirname, '../invoices');
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

      // Delete old invoice file if it exists
      if (booking.invoicePath) {
        const oldInvoicePath = path.join(invoiceDir, booking.invoicePath);
        if (fs.existsSync(oldInvoicePath)) {
          try {
            fs.unlinkSync(oldInvoicePath);
            console.log('🗑️  Deleted old invoice file:', booking.invoicePath);
          } catch (deleteErr) {
            console.warn('⚠️  Could not delete old invoice file:', deleteErr.message);
          }
        }
      }

      const invoiceFileName = `invoice-${bookingId}-${Date.now()}.pdf`;
      const invoicePath = path.join(invoiceDir, invoiceFileName);

      const invoiceData = {
        invoiceNumber: `INV-${bookingId}-${Date.now()}`,
        date: new Date(),
        bookingId: bookingId,
        customer: {
          name: user.name || 'Customer',
          email: user.email || '',
          phone: user.phone || ''
        },
        hotel: {
          name: booking.hotelId?.name || 'Hotel',
          address: booking.hotelId?.location?.address || ''
        },
        checkIn,
        checkOut,
        nights,
        guests: booking.guests || 1,
        basePrice: booking.priceSnapshot?.basePriceTotal || 0,
        cleaningFee: booking.priceSnapshot?.cleaningFee || 0,
        serviceFee: booking.priceSnapshot?.serviceFee || 0,
        discount: booking.priceSnapshot?.discounts || 0,
        couponCode: booking.couponId?.code || booking.priceSnapshot?.couponCode,
        total: booking.priceSnapshot?.totalPrice || booking.totalPrice,
        currency: 'PKR',
        payment: payment ? {
          method: payment.method || payment.paymentMethod || 'N/A',
          transactionId: payment.transactionId || 'N/A',
          date: payment.createdAt || payment.processedAt || new Date()
        } : undefined
      };

      await generateInvoicePDF(invoiceData, invoicePath);

      let invoiceUrl = '';
      let cloudinaryPublicId = '';

      // Upload to Cloudinary if configured
      if (hasCloudinaryConfig) {
        try {
          const cloudinaryResult = await uploadInvoiceToCloudinary(invoicePath, bookingId);
          invoiceUrl = cloudinaryResult.url;
          cloudinaryPublicId = cloudinaryResult.publicId;
          console.log('✅ Regenerated invoice uploaded to Cloudinary:', invoiceUrl);
        } catch (cloudinaryError) {
          console.error('❌ Failed to upload to Cloudinary, using local storage:', cloudinaryError);
          const invoiceBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';
          invoiceUrl = `${invoiceBaseUrl.replace(/\/$/, '')}/invoices/${invoiceFileName}`;
        }
      } else {
        const invoiceBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';
        invoiceUrl = `${invoiceBaseUrl.replace(/\/$/, '')}/invoices/${invoiceFileName}`;
      }

      await this.bookingRepository.updateById(bookingId, {
        invoicePath: invoiceFileName,
        invoiceUrl: invoiceUrl,
        cloudinaryPublicId: cloudinaryPublicId || undefined
      });

      console.log('Invoice regenerated for rescheduled booking:', invoiceFileName);

      if (payment) {
        const paymentMethodLabelMap = {
          card: 'Credit/Debit Card',
          paypal: 'PayPal',
          wallet: 'Wallet',
          bank_transfer: 'Bank Transfer',
        };
        const paymentMethodLabel = paymentMethodLabelMap[payment.method] || payment.method || 'N/A';

        const invoicePublicUrl = invoiceUrl || (() => {
          const invoiceBaseUrl =
            process.env.BACKEND_BASE_URL ||
            process.env.API_BASE_URL ||
            process.env.SERVER_URL ||
            process.env.APP_URL ||
            process.env.BASE_URL ||
            'http://localhost:5000';
          const normalizedInvoiceBaseUrl = invoiceBaseUrl.replace(/\/$/, '');
          return `${normalizedInvoiceBaseUrl}/invoices/${invoiceFileName}`;
        })();

        let invoiceDataUri = null;
        try {
          const fileBuffer = fs.readFileSync(invoicePath);
          if (fileBuffer?.length) {
            invoiceDataUri = `data:application/pdf;base64,${fileBuffer.toString('base64')}`;
          }
        } catch (dataUriErr) {
          console.error('Error creating invoice data URI:', dataUriErr);
        }

        const paymentDetailsForInvoice = {
          id: payment._id,
          amount: booking.priceSnapshot?.totalPrice || booking.totalPrice,
          method: paymentMethodLabel,
          transactionId: payment.transactionId || 'N/A',
          processedAt: payment.processedAt || payment.createdAt || new Date(),
          currency: 'PKR'
        };

        const invoiceEmailTemplate = emailTemplates.invoiceEmail(
          paymentDetailsForInvoice,
          booking,
          booking.hotelId || {},
          { name: user.name, email: user.email },
          invoiceFileName,
          invoicePublicUrl,
          invoiceDataUri
        );

        const attachments = [];
        if (fs.existsSync(invoicePath)) {
          attachments.push({
            filename: `invoice-${bookingId}.pdf`,
            path: invoicePath
          });
        }

        await sendEmail(
          user.email,
          `Updated Invoice - ${invoiceEmailTemplate.subject}`,
          invoiceEmailTemplate.html,
          invoiceEmailTemplate.text,
          {
            userId,
            useUserGmail: true,
            attachments
          }
        );

        console.log(`✅ Updated invoice email sent to customer: ${user.email}`);
      }
    } catch (error) {
      console.error('Error regenerating invoice:', error);
    }
  }
}

module.exports = new BookingService();
