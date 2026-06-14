class PaymentGatewayService {
   async processTransaction(payment, context = {}) {
      await new Promise(resolve => setTimeout(resolve, 1000));

     const success = Math.random() > 0.1;

    if (success) {
       return {
          success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         message: 'Payment processed successfully',
          metadata: {
          method: payment.paymentMethod,
           ...context.gatewayMetadata
          }
      };
     }

    return {
       success: false,
        error: 'Payment declined by bank',
      code: 'CARD_DECLINED'
     };
    }
}

module.exports = new PaymentGatewayService();

