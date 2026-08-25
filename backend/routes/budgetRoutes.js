const express = require('express');
const router = express.Router();
const { getBudgets, setBudget, deleteBudget,getBudgetRecommendations } = require('../controllers/budgetController');
const { protect } = require('../middlewares/auth'); 

router.use(protect);
router.route('/').get(getBudgets).post(setBudget);
router.route('/:id').delete(deleteBudget);
router.get('/recommendations', getBudgetRecommendations);
//budgets

module.exports = router;