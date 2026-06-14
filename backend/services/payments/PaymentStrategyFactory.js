const GatewayPaymentStrategy = require('./strategies/GatewayPaymentStrategy');
const WalletPaymentStrategy = require('./strategies/WalletPaymentStrategy');

class PaymentStrategyFactory {
   static create(method = 'card') {
      if (!method) {
      return new GatewayPaymentStrategy('card');
     }

    if (method === 'wallet') {
       return new WalletPaymentStrategy();
      }

     return new GatewayPaymentStrategy(method);
    }
}

module.exports = PaymentStrategyFactory;

