const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const ApiResponse = require('../utils/apiResponse');

// PRIVACY RULE: Personal transactions belong strictly to their owner. No role —
// including superadmin — may list, view, edit, or delete another user's personal
// transactions. Community expense visibility is handled separately via
// communityController.getCommunityTransactions, which is scoped to community members.

// @desc    List MY OWN transactions
// @route   GET /api/transactions
// @access  Private
  exports.getTransactions = asyncHandler(async (req, res) => {
    const {
      type, category, status, community, startDate, endDate,
      search = '', page = 1, limit = 10, sort = '-date',
    } = req.query;

    const query = { owner: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (community) query.community = community;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { transactionNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('community', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);

    ApiResponse.success(res, 200, 'Transactions fetched', transactions, {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  });

// @desc    Get a single transaction — owner only
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransactionById = asyncHandler(async (req, res) => {
  const txn = await Transaction.findOne({ _id: req.params.id, owner: req.user._id })
    .populate('community', 'name');

  if (!txn) return ApiResponse.error(res, 404, 'Transaction not found');
  ApiResponse.success(res, 200, 'Transaction fetched', txn);
});

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res) => {
  const txn = await Transaction.create({ ...req.body, owner: req.user._id, community: null });
  ApiResponse.success(res, 201, 'Transaction created', txn);
});

// @desc    Update transaction — owner only
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = asyncHandler(async (req, res) => {
  const txn = await Transaction.findOne({ _id: req.params.id, owner: req.user._id });
  if (!txn) return ApiResponse.error(res, 404, 'Transaction not found');

  const editable = [
    'type', 'category', 'amount', 'date', 'description', 'paymentMode',
    'status', 'tags', 'isRecurring', 'recurringFrequency', 'reminder', 'isPinned',
  ];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) txn[f] = req.body[f];
  });

  await txn.save();
  ApiResponse.success(res, 200, 'Transaction updated', txn);
});

// @desc    Delete transaction — owner only
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res) => {
  const txn = await Transaction.findOne({ _id: req.params.id, owner: req.user._id });
  if (!txn) return ApiResponse.error(res, 404, 'Transaction not found');

  await txn.deleteOne();
  ApiResponse.success(res, 200, 'Transaction deleted');
});
