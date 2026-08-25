const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const asyncHandler = require('express-async-handler');
const ApiResponse = require('../utils/ApiResponse');

exports.getBudgets = asyncHandler(async (req, res) => {
  const { month, periodType } = req.query; 
  const query = { user: req.user._id };
  
  if (periodType) query.periodType = periodType;
  if (month) query.month = month;

  const budgets = await Budget.find(query).sort('-createdAt');

  const enrichedBudgets = await Promise.all(budgets.map(async (budget) => {
    let startDate, endDate;

    if (budget.periodType === 'yearly') {
      const year = Number(budget.month);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year + 1, 0, 1);
    } else {
      const [year, monthNum] = (budget.month && budget.month.includes('-')) 
        ? budget.month.split('-') 
        : [new Date().getFullYear(), new Date().getMonth() + 1];
        
      startDate = new Date(Number(year), Number(monthNum) - 1, 1);
      endDate = new Date(Number(year), Number(monthNum), 1);
    }

    const matchCriteria = {
      owner: req.user._id,
      category: { $regex: new RegExp(`^${budget.category}$`, 'i') },
      type: 'Expense',
      date: { $gte: startDate, $lt: endDate }
    };

    const result = await Transaction.aggregate([
      { $match: matchCriteria },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
    ]);

    const spent = result.length > 0 ? result[0].totalSpent : 0;
    const budgetAmount = Number(budget.amount) || 1;

    return {
      ...budget.toObject(),
      spent,
      percentage: Math.min(100, Math.round((spent / budgetAmount) * 100)),
      isExceeded: spent > budgetAmount
    };
  }));

  ApiResponse.success(res, 200, 'Budgets fetched successfully', enrichedBudgets);
});

exports.setBudget = asyncHandler(async (req, res) => {
  const { category, amount, month, periodType } = req.body;

  if (!category || !amount || !month) {
    return ApiResponse.error(res, 400, 'Please provide category, amount, and month');
  }

  const currentPeriodType = periodType || 'monthly';

  // Check if a budget for this category and period already exists
  const existingBudget = await Budget.findOne({ 
    user: req.user._id, 
    category, 
    month, 
    periodType: currentPeriodType 
  });

  if (existingBudget) {
    return ApiResponse.error(res, 400, 'Please delete the existing category and set again');
  }

  // Create new budget if it doesn't exist
  const budget = await Budget.create({
    user: req.user._id,
    category,
    amount,
    month,
    periodType: currentPeriodType
  });

  ApiResponse.success(res, 201, 'Budget saved successfully', budget);
});

exports.deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
  if (!budget) return ApiResponse.error(res, 404, 'Budget not found');

  await budget.deleteOne();
  ApiResponse.success(res, 200, 'Budget deleted successfully');
});

exports.getBudgetRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const pastSpending = await Transaction.aggregate([
    { 
      $match: { 
        owner: userId, 
        type: 'Expense', 
        date: { $gte: threeMonthsAgo } 
      } 
    },
    { 
      $group: { 
        _id: '$category', 
        totalSpent: { $sum: '$amount' },
        count: { $sum: 1 }
      } 
    }
    
  ]);
//recomandations
  const recommendations = pastSpending.map(item => {
    const avgMonthlySpend = Math.round(item.totalSpent / 3);
    const suggestedLimit = Math.ceil((avgMonthlySpend * 1.1) / 500) * 500;

    return {
      category: item._id || 'Others',
      suggestedAmount: Math.max(1000, suggestedLimit),
      rationale: `Based on your past 3 months spending average of ₹${avgMonthlySpend.toLocaleString()}`
    };
  });

  ApiResponse.success(res, 200, 'Recommendations generated successfully', recommendations);
});