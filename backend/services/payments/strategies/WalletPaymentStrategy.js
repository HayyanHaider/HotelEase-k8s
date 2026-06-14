const BasePaymentStrategy = require('./BasePaymentStrategy');

class WalletPaymentStrategy extends BasePaymentStrategy {
  constructor() {
     super('wallet');
    }

   validate(payment, context) {
      const errors = [];

     if (!context.userId) {
        errors.push('User ID is required for wallet payments');
    }

      if (context.walletBalance === null || context.walletBalance === undefined) {
      errors.push('Wallet balance is required for wallet payments');
     }

    if ((context.walletBalance || 0) < payment.amount) {
       errors.push(`Insufficient wallet balance. You have PKR ${(context.walletBalance || 0).toFixed(2)}, but need PKR ${payment.amount.toFixed(2)}`);
      }

     return errors;
    }

   async execute(payment) {
      payment.processingFee = 0;
    payment.netAmount = payment.amount;

      return {
      success: true,
       transactionId: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Payment processed successfully from wallet',
      requiresWalletDeduction: true
     };
    }
}

module.exports = WalletPaymentStrategy;

