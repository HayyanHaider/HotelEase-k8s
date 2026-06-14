class BasePaymentStrategy {
   constructor(method) {
      this.method = method;
  }

    validate(payment, context) {
    return [];
   }

  async execute(payment, context) { // eslint-disable-line no-unused-vars
     throw new Error('execute() must be implemented by subclasses');
    }

   async process(payment, context = {}) {
      const validationErrors = this.validate(payment, context);
    if (validationErrors.length > 0) {
       return {
          success: false,
        error: validationErrors.join(', '),
         transactionId: null
        };
    }

      return this.execute(payment, context);
  }
}

module.exports = BasePaymentStrategy;

