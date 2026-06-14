const { AppError } = require('../utils/errors');

function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || 500;
   const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
}

module.exports = errorMiddleware;


