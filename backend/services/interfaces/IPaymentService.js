class IPaymentService {
   async processPayment(paymentData, userId) {
      throw new Error('processPayment method must be implemented');
  }

    async getPaymentById(paymentId, userId) {
    throw new Error('getPaymentById method must be implemented');
   }

  async getUserPayments(userId, filters = {}) {
     throw new Error('getUserPayments method must be implemented');
    }
}

module.exports = IPaymentService;

