const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

// Verifies access token from Authorization header
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 401, 'Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return ApiResponse.error(res, 401, 'User no longer exists');
    }
    if (user.status === 'suspended') {
      return ApiResponse.error(res, 403, 'Account suspended. Contact administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 401, 'Not authorized, token invalid or expired');
  }
});

// Role-based access guard. Usage: authorize('superadmin', 'admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return ApiResponse.error(res, 403, 'Forbidden: insufficient permissions');
    }
    next();
  };
};

// Ensures a user can only touch their own resource, unless admin/superadmin
const ownershipOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    if (['admin', 'superadmin'].includes(req.user.role)) return next();
    const ownerId = await getOwnerId(req);
    if (String(ownerId) !== String(req.user._id)) {
      return ApiResponse.error(res, 403, 'Forbidden: not the resource owner');
    }
    next();
  };
};

module.exports = { protect, authorize, ownershipOrAdmin };
