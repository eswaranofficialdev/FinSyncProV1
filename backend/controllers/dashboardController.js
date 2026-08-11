const asyncHandler = require('express-async-handler');
const dayjs = require('dayjs');
const Transaction = require('../models/Transaction');
const CommunityMember = require('../models/CommunityMember');
const ApiResponse = require('../utils/apiResponse');

// @desc    Dashboard summary: today/week/month/year totals, income vs expense, category breakdown, trend
//          Always scoped to the logged-in user's own data — nobody, including
//          superadmin, can view another user's personal dashboard.
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = asyncHandler(async (req, res) => {
  const ownerFilter = { owner: req.user._id };

  const now = dayjs();
  const ranges = {
    today: [now.startOf('day').toDate(), now.endOf('day').toDate()],
    week: [now.startOf('week').toDate(), now.endOf('week').toDate()],
    month: [now.startOf('month').toDate(), now.endOf('month').toDate()],
    year: [now.startOf('year').toDate(), now.endOf('year').toDate()],
  };

  const sumFor = async (type, [start, end]) => {
    const result = await Transaction.aggregate([
      { $match: { ...ownerFilter, type, date: { $gte: start, $lte: end } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]);
    return result[0]?.sum || 0;
  };

  const [
    todayExpense, weekExpense, monthExpense, yearExpense,
    monthIncome, yearIncome,
    communityExpense,
  ] = await Promise.all([
    sumFor('expense', ranges.today),
    sumFor('expense', ranges.week),
    sumFor('expense', ranges.month),
    sumFor('expense', ranges.year),
    sumFor('income', ranges.month),
    sumFor('income', ranges.year),
    Transaction.aggregate([
      { $match: { ...ownerFilter, community: { $ne: null } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.sum || 0),
  ]);

  const balance = yearIncome - yearExpense;
  const savings = Math.max(balance, 0);
  const expenseRatio = yearIncome > 0 ? Math.round((yearExpense / yearIncome) * 100) : 0;

  // Top categories this month
  const topCategories = await Transaction.aggregate([
    { $match: { ...ownerFilter, type: 'expense', date: { $gte: ranges.month[0], $lte: ranges.month[1] } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);

  // Monthly trend (last 6 months): income vs expense
  const sixMonthsAgo = now.subtract(5, 'month').startOf('month').toDate();
  const trend = await Transaction.aggregate([
    { $match: { ...ownerFilter, date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const recentTransactions = await Transaction.find(ownerFilter)
    .sort({ date: -1, createdAt: -1 })
    .limit(10)
    .populate('community', 'name');

  ApiResponse.success(res, 200, 'Dashboard data fetched', {
    cards: {
      todayExpense, weekExpense, monthExpense, yearExpense,
      monthIncome, yearIncome, communityExpense,
      balance, savings, expenseRatio,
    },
    topCategories,
    trend,
    recentTransactions,
  });
});

// @desc    Financial reports with filters, grouped by period/category
//          Always scoped to the logged-in user's own transactions.
// @route   GET /api/dashboard/reports
// @access  Private
exports.getReports = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'month', type } = req.query;

  const ownerFilter = { owner: req.user._id };

  const match = { ...ownerFilter };
  if (type) match.type = type;
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const groupIdMap = {
    day: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } },
    week: { year: { $year: '$date' }, week: { $week: '$date' } },
    month: { year: { $year: '$date' }, month: { $month: '$date' } },
    year: { year: { $year: '$date' } },
    category: { category: '$category' },
  };

  const report = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupIdMap[groupBy] || groupIdMap.month,
        totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  ApiResponse.success(res, 200, 'Report generated', report);
});
