const express = require('express');
const router = express.Router();
const {
  getTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { transactionValidator } = require('../validators/transactionValidators');

router.use(protect);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/', transactionValidator, validate, createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
