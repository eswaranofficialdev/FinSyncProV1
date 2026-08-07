const express = require('express');
const router = express.Router();
const { getDashboard, getReports } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/', getDashboard);
router.get('/reports', getReports);

module.exports = router;
