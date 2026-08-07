const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} = require('../utils/generateTokens');

// @desc    Register a new User (active immediately — no approval needed)
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return ApiResponse.error(res, 409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'user',
    status: 'active',
  });

  ApiResponse.success(res, 201, 'Registration successful. You can now log in.', {
    id: user._id,
    email: user.email,
    status: user.status,
  });
});

// @desc    Login (superadmin/admin/user)
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return ApiResponse.error(res, 401, 'Invalid email or password');
  }

  if (user.status === 'suspended') {
    return ApiResponse.error(res, 403, 'Your account has been suspended. Contact administrator.');
  }
  if (user.status === 'rejected') {
    return ApiResponse.error(res, 403, 'Your registration was rejected.');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken]; // keep last 5 sessions
  user.lastLogin = new Date();
  user.isOnline = true;
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  ApiResponse.success(res, 200, 'Login successful', {
    user: user.toSafeObject(),
    accessToken,
  });
});

// @desc    Refresh access token using httpOnly refresh cookie
// @route   POST /api/auth/refresh
// @access  Public (requires valid refresh cookie)
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return ApiResponse.error(res, 401, 'No refresh token provided');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return ApiResponse.error(res, 401, 'Refresh token invalid or expired');
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    return ApiResponse.error(res, 401, 'Refresh token not recognized');
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  ApiResponse.success(res, 200, 'Token refreshed', { accessToken: newAccessToken });
});

// @desc    Logout - invalidate refresh token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token && req.user) {
    req.user.refreshTokens = (req.user.refreshTokens || []).filter((t) => t !== token);
    req.user.isOnline = false;
    await req.user.save();
  }
  res.clearCookie('refreshToken');
  ApiResponse.success(res, 200, 'Logged out successfully');
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  ApiResponse.success(res, 200, 'Current user fetched', req.user.toSafeObject());
});

// @desc    Forgot password - generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way to avoid email enumeration
  if (!user) {
    return ApiResponse.success(res, 200, 'If that email exists, a reset link has been sent.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 min
  await user.save();

  // In production: send via Brevo SMTP (see services/emailService.js)
  ApiResponse.success(res, 200, 'If that email exists, a reset link has been sent.', {
    devResetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
  });
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    return ApiResponse.error(res, 400, 'Reset token is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshTokens = []; // force re-login everywhere
  await user.save();

  await Notification.create({
    recipient: user._id,
    type: 'password_changed',
    title: 'Password Changed',
    message: 'Your password was changed successfully.',
  });

  ApiResponse.success(res, 200, 'Password reset successful. Please log in.');
});
