const { body } = require('express-validator');

exports.transactionValidator = [
  body('type')
    .isIn(['income', 'Expense', 'investment', 'loan', 'savings'])
    .withMessage('Invalid transaction type'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('date').optional().isISO8601().withMessage('Invalid date'),
  body('category').optional().isString(),
  body('description').optional().isString().isLength({ max: 500 }),
];
