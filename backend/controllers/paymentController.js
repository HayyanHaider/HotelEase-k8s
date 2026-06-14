const BaseController = require('./BaseController');
const PaymentService = require('../services/PaymentService');

class PaymentController extends BaseController {
   constructor() {
      super();
    this.paymentService = PaymentService;
   }

  processPayment = async (req, res) => {
     try {
        const userId = req.user?.userId;
      
       if (!userId) {
          return this.fail(res, 401, 'User not authenticated');
      }

        const result = await this.paymentService.processPayment(req.body, userId);
      
       return this.ok(res, {
        message: 'Payment processed successfully',
        payment: result.payment,
         booking: result.booking
        });
  } catch (error) {
     console.error('Process payment error:', error);
        const statusCode = error.message.includes('not found') ||
                        error.message.includes('already completed') ||
                         error.message.includes('required') ||
                          error.message.includes('Insufficient') ? 400 : 500;
      return this.fail(res, statusCode, error.message || 'Server error while processing payment');
     }
    };

   getPaymentHistory = async (req, res) => {
      try {
      const userId = req.user?.userId;
      
        if (!userId) {
        return this.fail(res, 401, 'User not authenticated');
       }

      const result = await this.paymentService.getUserPayments(userId, req.query);
      
        return this.ok(res, {
        count: result.count,
         payments: result.payments
        });
    } catch (error) {
       console.error('Get payment history error:', error);
        return this.fail(res, 500, error.message || 'Server error while fetching payment history');
    }
   };

  getPaymentById = async (req, res) => {
     try {
      const userId = req.user?.userId;
      const { paymentId } = req.params;
    
      if (!userId) {
        return this.fail(res, 401, 'User not authenticated');
       }

      const payment = await this.paymentService.getPaymentById(paymentId, userId);
      
        return this.ok(res, { payment });
    } catch (error) {
       console.error('Get payment by ID error:', error);
        const statusCode = error.message.includes('not found') || 
                        error.message.includes('Not authorized') ? 404 : 500;
       return this.fail(res, statusCode, error.message || 'Server error while fetching payment');
      }
  };

    downloadInvoice = async (req, res) => {
    try {
       const userId = req.user?.userId;
        const { bookingId } = req.params;

       if (!userId) {
          return this.fail(res, 401, 'User not authenticated');
      }

        const fs = require('fs');
      const path = require('path');

        const invoicePath = await this.paymentService.getInvoicePath(bookingId, userId);

       if (!fs.existsSync(invoicePath)) {
          return this.fail(res, 404, 'Invoice file not found');
      }

        const filename = path.basename(invoicePath);

       res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

       const fileStream = fs.createReadStream(invoicePath);
        fileStream.pipe(res);
    } catch (error) {
       console.error('Download invoice error:', error);
        const statusCode = error.message.includes('not found') || 
                        error.message.includes('Not authorized') ? 
                         (error.message.includes('Not authorized') ? 403 : 404) : 500;
        return this.fail(res, statusCode, error.message || 'Server error while downloading invoice');
    }
   };
}

module.exports = new PaymentController();
