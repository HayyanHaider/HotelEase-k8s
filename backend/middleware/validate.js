// Lightweight validation middleware without external deps
// Usage: validate(({ body, query, params }) => ({ valid: true }) | throws Error)

const { AppError } = require('../utils/errors');

function validate(validator) {
  return (req, res, next) => {
     try {
        const result = validator({ body: req.body, query: req.query, params: req.params });
      if (result && result.valid === false) {
         throw new AppError(result.message || 'Validation failed', result.statusCode || 400);
        }
      next();
     } catch (err) {
        next(err);
    }
   };
}

module.exports = validate;


