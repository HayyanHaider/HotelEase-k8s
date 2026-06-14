const BaseEntity = require('./BaseEntity');
const PaymentStrategyFactory = require('../services/payments/PaymentStrategyFactory');

class Payment extends BaseEntity {
   constructor(paymentData = {}) {
      super(paymentData);
    this.bookingId = paymentData.bookingId;
     this.customerId = paymentData.customerId;
      this.amount = paymentData.amount;
    this.method = paymentData.method || paymentData.paymentMethod;
     this.paymentMethod = paymentData.paymentMethod || paymentData.method;
      this.type = paymentData.type || 'booking_payment';
    this.status = paymentData.status || 'pending';
     this.transactionId = paymentData.transactionId || null;
      this.processedAt = paymentData.processedAt || null;
    this.failureReason = paymentData.failureReason || null;
     this.refundStatus = paymentData.refundStatus || 'not_refunded';
      this.refundedAt = paymentData.refundedAt || null;
    this.refundReason = paymentData.refundReason || null;
     this.originalPaymentId = paymentData.originalPaymentId || null;
      this.lastPaymentContext = paymentData.lastPaymentContext || null;
  }

    // Encapsulation: Private method to validate payment data
  #validatePaymentData() {
     const errors = [];
    
    if (!this.bookingId) {
       errors.push('Booking ID is required');
      }
    
     if (!this.customerId) {
        errors.push('Customer ID is required');
    }
    
      if (!this.amount || this.amount <= 0) {
      errors.push('Valid payment amount is required');
     }
    
    if (!this.paymentMethod) {
       errors.push('Payment method is required');
      }
    
     return errors;
    }

   // Method to validate payment information
    validate() {
    return this.#validatePaymentData();
   }

  // Method to calculate processing fee
   calculateProcessingFee() {
      const feePercentage = this.#getProcessingFeeRate();
    this.processingFee = this.amount * feePercentage;
     this.netAmount = this.amount - this.processingFee;
      this.updatedAt = new Date();
  }

    // Encapsulation: Private method to get processing fee rate based on payment method
  #getProcessingFeeRate() {
     const feeRates = {
        'card': 0.029, // 2.9%
      'paypal': 0.034, // 3.4%
       'wallet': 0, // No fee for wallet payments
        'bank_transfer': 0.01, // 1%
      'crypto': 0.015 // 1.5%
     };
    
    return feeRates[this.paymentMethod] || 0.03; // Default 3%
   }

  // Method to process payment
   async processPayment(paymentContext = {}) {
      // Allow processing if status is pending or not set
    if (this.status && this.status !== 'pending') {
       throw new Error('Only pending payments can be processed');
      }
    
     this.status = 'processing';
      this.updatedAt = new Date();
    this.lastPaymentContext = paymentContext;
    
      try {
      const strategy = PaymentStrategyFactory.create(this.paymentMethod);
       const result = await strategy.process(this, paymentContext);
      
      if (result.success) {
         this.status = 'completed';
          this.transactionId = result.transactionId;
        this.processedAt = new Date();
       } else {
          this.status = 'failed';
        this.failureReason = result.error;
       }
      
      this.updatedAt = new Date();
      
        return {
        success: result.success,
         transactionId: result.transactionId || null,
          message: result.message || (result.success ? 'Payment processed successfully' : undefined),
        error: result.error,
         requiresWalletDeduction: result.requiresWalletDeduction
        };
      
     } catch (error) {
        this.status = 'failed';
      this.failureReason = error.message;
       this.updatedAt = new Date();
        return {
        success: false,
         error: error.message,
          transactionId: null
      };
     }
    }

   // Method to refund payment
    async refundPayment(refundAmount = null, reason = '') {
    if (this.status !== 'completed') {
       throw new Error('Only completed payments can be refunded');
      }
    
     const amountToRefund = refundAmount || this.amount;
    
    if (amountToRefund > this.amount) {
       throw new Error('Refund amount cannot exceed original payment amount');
      }
    
     try {
        // Simulate refund processing
      const result = await this.#processRefund(amountToRefund);
      
        if (result.success) {
        this.refundStatus = 'processed';
         this.refundReason = reason;
          this.refundedAt = new Date();
        this.updatedAt = new Date();
         return true;
        } else {
        this.refundStatus = 'failed';
         this.refundReason = reason;
          throw new Error(result.error);
      }
      
      } catch (error) {
      this.failureReason = `Refund failed: ${error.message}`;
       this.refundStatus = 'failed';
        this.updatedAt = new Date();
      return false;
     }
    }

   // Encapsulation: Private method to process refund
    async #processRefund(amount) {
    // Simulate refund API call
     await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate refund processing (95% success rate)
     const success = Math.random() > 0.05;
    
    if (success) {
       return {
          success: true,
        refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         message: 'Refund processed successfully'
        };
    } else {
       return {
          success: false,
        error: 'Refund processing failed'
       };
      }
  }

    // Method to retry failed payment
  async retryPayment() {
     if (this.status !== 'failed') {
        throw new Error('Only failed payments can be retried');
    }
    
      // Reset payment status
    this.status = 'pending';
     this.failureReason = '';
      this.gatewayResponse = {};
    this.updatedAt = new Date();
    
      // Process payment again
    return await this.processPayment(this.lastPaymentContext || {});
   }

  // Method to check if payment is successful
   isSuccessful() {
      return this.status === 'completed';
  }

    // Method to check if payment is pending
  isPending() {
     return this.status === 'pending' || this.status === 'processing';
    }

   // Method to check if payment failed
    isFailed() {
    return this.status === 'failed';
   }

  // Method to check if payment is refunded
   isRefunded() {
      return this.refundStatus === 'processed' || this.status === 'refunded';
  }

    // Method to get payment summary
  getSummary() {
     return {
        amount: this.amount,
      processingFee: this.processingFee || 0,
       netAmount: this.netAmount || this.amount,
        paymentMethod: this.paymentMethod,
      status: this.status,
       refundStatus: this.refundStatus
      };
  }

    // Static method to search payments by criteria
  static searchByCriteria(payments, criteria) {
     return payments.filter(payment => {
        let matches = true;
      
       if (criteria.customerId && payment.customerId !== criteria.customerId) {
          matches = false;
      }
      
        if (criteria.bookingId && payment.bookingId !== criteria.bookingId) {
        matches = false;
       }
      
      if (criteria.status && payment.status !== criteria.status) {
         matches = false;
        }
      
       if (criteria.paymentMethod && payment.paymentMethod !== criteria.paymentMethod) {
          matches = false;
      }
      
        if (criteria.minAmount && payment.amount < criteria.minAmount) {
        matches = false;
       }
      
      if (criteria.maxAmount && payment.amount > criteria.maxAmount) {
         matches = false;
        }
      
       if (criteria.dateFrom && payment.createdAt < new Date(criteria.dateFrom)) {
          matches = false;
      }
      
        if (criteria.dateTo && payment.createdAt > new Date(criteria.dateTo)) {
        matches = false;
       }
      
      return matches;
     });
    }

   // Method to get payment statistics
    getStats() {
    return {
       amount: this.amount,
        processingFee: this.processingFee || 0,
      netAmount: this.netAmount || this.amount,
       status: this.status,
        refundStatus: this.refundStatus,
      paymentMethod: this.paymentMethod,
       isSuccessful: this.isSuccessful(),
        isPending: this.isPending(),
      isFailed: this.isFailed(),
       isRefunded: this.isRefunded()
      };
  }

    // Method to get public payment information
  getPublicInfo() {
     return {
        id: this.id,
      amount: this.amount,
       status: this.status,
        paymentMethod: this.paymentMethod,
      createdAt: this.createdAt,
       processedAt: this.processedAt
      };
  }

    // Method to get detailed information (for customer/admin)
  getDetailedInfo() {
     return {
        ...this.getPublicInfo(),
      bookingId: this.bookingId,
       customerId: this.customerId,
        type: this.type,
      transactionId: this.transactionId,
       processingFee: this.processingFee || 0,
        netAmount: this.netAmount || this.amount,
      refundStatus: this.refundStatus,
       refundReason: this.refundReason,
        failureReason: this.failureReason,
      refundedAt: this.refundedAt,
       processedAt: this.processedAt,
        originalPaymentId: this.originalPaymentId,
      updatedAt: this.updatedAt
     };
    }

   // Method to generate payment receipt
    generateReceipt() {
    return {
       paymentId: this.id,
        transactionId: this.transactionId,
      amount: this.amount,
       processingFee: this.processingFee || 0,
        netAmount: this.netAmount || this.amount,
      paymentMethod: this.paymentMethod,
       status: this.status,
        paidAt: this.processedAt,
      bookingId: this.bookingId
     };
    }
}

module.exports = Payment;
