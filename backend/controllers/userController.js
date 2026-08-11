const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const CommunityMember = require('../models/CommunityMember');
const ApiResponse = require('../utils/apiResponse');

// NOTE: Personal transaction totals/stats are intentionally NOT exposed here.
// Nobody — including the Super Admin — can see another user's personal financial data.
// This endpoint only exposes account/profile-level information.

// @desc    List users (Super Admin oversight only)
// @route   GET /api/users
// @access  Private (superadmin)
exports.getUsers = asyncHandler(async (req, res) => {
  const { search = '', status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

  const query = { role: 'user' };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  ApiResponse.success(res, 200, 'Users fetched', users, {
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
});

// @desc    Get single user's public profile (no financial data)
// @route   GET /api/users/:id
// @access  Private (self, superadmin)
exports.getUserById = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return ApiResponse.error(res, 404, 'User not found');

  const isSelf = String(target._id) === String(req.user._id);
  if (!isSelf && req.user.role !== 'superadmin') {
    return ApiResponse.error(res, 403, 'Forbidden');
  }

  const communityCount = await CommunityMember.countDocuments({ user: target._id });

  // Personal financial stats (income/expense totals) are only visible to the account owner.
  const payload = { ...target.toSafeObject(), stats: { communityCount } };
  if (isSelf) {
    const Transaction = require('../models/Transaction');
    const [totalIncome, totalExpense] = await Promise.all([
      Transaction.aggregate([
        { $match: { owner: target._id, type: 'income' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { owner: target._id, type: 'expense' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ]),
    ]);
    payload.stats.totalIncome = totalIncome[0]?.sum || 0;
    payload.stats.totalExpense = totalExpense[0]?.sum || 0;
  }

  ApiResponse.success(res, 200, 'User fetched', payload);
});

// @desc    Search users by name/email to invite into a community.
//          Available to any authenticated user. Returns only minimal, non-sensitive fields.
// @route   GET /api/users/search?q=...
// @access  Private (any authenticated user)
exports.searchUsers = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  if (!q || q.trim().length < 2) {
    return ApiResponse.success(res, 200, 'Search results', []);
  }

  const users = await User.find({
    role: 'user',
    status: 'active',
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { uid: { $regex: q, $options: 'i' } },
    ],
  })
    .select('name email uid')
    .limit(10);

  ApiResponse.success(res, 200, 'Search results', users);
});

// @desc    Update user profile fields (self, or superadmin)
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'phone', 'bio', 'location', 'profession',
    'currency', 'timezone', 'language', 'theme',
  ];
  const target = await User.findById(req.params.id);
  if (!target) return ApiResponse.error(res, 404, 'User not found');

  const isSelf = String(target._id) === String(req.user._id);
  const isSuperAdmin = req.user.role === 'superadmin';

  if (!isSelf && !isSuperAdmin) {
    return ApiResponse.error(res, 403, 'Forbidden');
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) target[field] = req.body[field];
  });

  await target.save();
  ApiResponse.success(res, 200, 'User updated', target.toSafeObject());
});

// @desc    Delete a user account
// @route   DELETE /api/users/:id
// @access  Private (superadmin)
exports.deleteUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return ApiResponse.error(res, 404, 'User not found');

  if (target.role === 'superadmin') {
    return ApiResponse.error(res, 403, 'Super Admin account cannot be deleted');
  }

  await target.deleteOne();
  ApiResponse.success(res, 200, 'User deleted successfully');
});

// @desc    Suspend / Activate a user
// @route   PATCH /api/users/:id/status
// @access  Private (superadmin)
exports.setUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active' | 'suspended'
  if (!['active', 'suspended'].includes(status)) {
    return ApiResponse.error(res, 400, 'Invalid status value');
  }

  const target = await User.findById(req.params.id);
  if (!target) return ApiResponse.error(res, 404, 'User not found');
  if (target.role === 'superadmin') {
    return ApiResponse.error(res, 403, 'Cannot change Super Admin status');
  }

  target.status = status;
  await target.save();
  ApiResponse.success(res, 200, `User ${status}`, target.toSafeObject());
});
