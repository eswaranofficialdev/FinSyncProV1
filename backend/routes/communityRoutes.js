const express = require('express');
const router = express.Router();
const {
  getCommunities, createCommunity, getCommunityById, getCommunityTransactions,
  addMember, removeMember, updateMemberRole, deleteCommunity,
  addSplitExpense, settleBalance,
  createSettlementRequest, getSettlementRequests, respondToSettlementRequest,
} = require('../controllers/communityController');
const { protect } = require('../middlewares/auth');

router.use(protect);

// Permission checks (owner-only, admin-only, member-only, superadmin) are enforced
// inside the controller since they depend on per-community membership, not global role.
router.get('/', getCommunities);
router.post('/', createCommunity);
router.get('/:id', getCommunityById);
router.delete('/:id', deleteCommunity);
router.get('/:id/transactions', getCommunityTransactions);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.patch('/:id/members/:userId/role', updateMemberRole);
router.post('/:id/split-expense', addSplitExpense);
router.post('/:id/settle', settleBalance);
router.post('/:id/settlement-requests', createSettlementRequest);
router.get('/:id/settlement-requests', getSettlementRequests);
router.patch('/:id/settlement-requests/:requestId', respondToSettlementRequest);

module.exports = router;