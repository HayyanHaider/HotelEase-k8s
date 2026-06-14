class AppError extends Error {
   constructor(message, statusCode = 500) {
      super(message);
    this.statusCode = statusCode;
   }
}

class ApiResponse {
    static ok(res, data) {
    return res.json({ success: true, ...data });
   }
    static created(res, data) {
    return res.status(201).json({ success: true, ...data });
   }
    static error(res, statusCode, message) {
    return res.status(statusCode).json({ success: false, message });
   }
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, ApiResponse, asyncHandler };


