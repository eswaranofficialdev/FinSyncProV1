const express = require('express');
const router = express.Router();
const {
  getUsers, getUserById, updateUser, deleteUser, setUserStatus, searchUsers,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/search', searchUsers); // must be before /:id
router.get('/', authorize('superadmin'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorize('superadmin'), deleteUser);
router.patch('/:id/status', authorize('superadmin'), setUserStatus);

module.exports = router;
