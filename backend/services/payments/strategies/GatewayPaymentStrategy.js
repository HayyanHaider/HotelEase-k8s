const BasePaymentStrategy = require('./BasePaymentStrategy');
const PaymentGatewayService = require('../PaymentGatewayService');

class GatewayPaymentStrategy extends BasePaymentStrategy {
   constructor(method) {
      super(method);
  }

    validate(payment, context) {
    const errors = [];

      if (this.method === 'card') {
      if (!context.cardDetails?.cardNumber || !context.cardDetails?.expiryDate || !context.cardDetails?.cvv) {
         errors.push('Card details are required for card payments');
        }
    }

      if (this.method === 'paypal') {
      if (!context.paypalDetails?.email || !context.paypalDetails?.password) {
         errors.push('PayPal email and password are required for PayPal payments');
        }
    }

      return errors;
  }

    async execute(payment, context) {
    payment.calculateProcessingFee();

      if (this.method === 'cash_on_arrival') {
        return {
          success: true,
          transactionId: null,
          message: 'Cash on arrival selected'
        };
      }

      const result = await PaymentGatewayService.processTransaction(payment, {
      gatewayMetadata: {
         last4: context.cardDetails?.cardNumber?.slice(-4),
          paypalEmail: context.paypalDetails?.email
      }
     });

    if (result.success) {
       return {
          success: true,
        transactionId: result.transactionId,
         message: result.message
        };
    }

      return {
      success: false,
       error: result.error || 'Payment processing failed',
        transactionId: result.transactionId || null
    };
   }
}

module.exports = GatewayPaymentStrategy;

