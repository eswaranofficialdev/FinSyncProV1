const express = require('express');
const router = express.Router();
const {
  register, login, refresh, logout, getMe, forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator,
} = require('../validators/authValidators');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

module.exports = router;
