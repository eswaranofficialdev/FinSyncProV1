const express = require('express');
const router = express.Router();
const {
  getCommunities, createCommunity, getCommunityById, getCommunityTransactions,
  addMember, removeMember, updateMemberRole, deleteCommunity,
  addSplitExpense, settleBalance,
  createSettlementRequest, getSettlementRequests, respondToSettlementRequest,updateCommunity,
  deleteCommunityTransaction,cancelSettlementRequest
} = require('../controllers/communityController');
const { protect } = require('../middlewares/auth');
const { deleteCommunityTransaction } = require('../controllers/communityController');
const {  cancelSettlementRequest} = require('../controllers/communityController');

router.use(protect);

router.delete('/transactions/:transactionId', protect, deleteCommunityTransaction);
router.get('/', getCommunities);
router.post('/', createCommunity);
router.get('/:id', getCommunityById);
router.delete('/:id', deleteCommunity);
router.get('/:id/transactions', getCommunityTransactions);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.patch('/:id/members/:userId/role', updateMemberRole);
router.post('/:id/split-Expense', addSplitExpense);
router.post('/:id/settle', settleBalance);
router.post('/:id/settlement-requests', createSettlementRequest);
router.get('/:id/settlement-requests', getSettlementRequests);
router.patch('/:id/settlement-requests/:requestId', respondToSettlementRequest);
router.put('/:id', protect, updateCommunity);
router.route('/:id/settlement-requests/:requestId')
  .patch(protect, respondToSettlementRequest)
  .delete(protect, cancelSettlementRequest);
  router.route('/:id/settle')
  .post(protect, settleBalance);

router.delete('/transactions/:transactionId', deleteCommunityTransaction);
router.delete('/:id/settlement-requests/:requestId', protect, cancelSettlementRequest);

module.exports = router;