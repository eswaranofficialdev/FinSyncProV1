const ApiResponse = require('../utils/apiResponse');

const notFound = (req, res, next) => {
  ApiResponse.error(res, 404, `Route not found: ${req.originalUrl}`);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.error(res, 400, 'Validation failed', errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, 409, `${field} already exists`);
  }

  if (err.name === 'CastError') {
    return ApiResponse.error(res, 400, `Invalid ${err.path}: ${err.value}`);
  }

  const statusCode = err.statusCode && err.statusCode !== 200 ? err.statusCode : 500;
  ApiResponse.error(res, statusCode, err.message || 'Server Error');
};

module.exports = { notFound, errorHandler };
