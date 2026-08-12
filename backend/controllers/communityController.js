const asyncHandler = require('express-async-handler');
const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const SettlementRequest = require('../models/SettlementRequest');
const ApiResponse = require('../utils/apiResponse');
const User = require('../models/User');

// ---------- helpers ----------

const getMembership = (communityId, userId) =>
  CommunityMember.findOne({ community: communityId, user: userId });

const isSuperadmin = (req) => req.user?.role === 'superadmin';

// ---------- controllers ----------

exports.getCommunities = asyncHandler(async (req, res) => {
  let communities;
  if (isSuperadmin(req)) {
    communities = await Community.find().populate('admin', 'name email');
  } else {
    const memberships = await CommunityMember.find({ user: req.user._id }).select('community role');
    const ids = memberships.map((m) => m.community);
    communities = await Community.find({ _id: { $in: ids } });
    const roleMap = Object.fromEntries(memberships.map((m) => [String(m.community), m.role]));
    communities = communities.map((c) => ({ ...c.toObject(), myRole: roleMap[String(c._id)] }));
  }
  ApiResponse.success(res, 200, 'Communities fetched', communities);
});

exports.createCommunity = asyncHandler(async (req, res) => {
  const { name, type, description } = req.body;
  const community = await Community.create({ name, type, description, admin: req.user._id });
  await CommunityMember.create({ community: community._id, user: req.user._id, role: 'owner' });
  ApiResponse.success(res, 201, 'Community created', community);
});

// 🌟 UPDATE COMMUNITY (For Editing Name & Description)
exports.updateCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  if (String(community.admin) !== String(req.user._id)) {
    return ApiResponse.error(res, 403, 'Only the community owner can edit community details');
  }

  const { name, description } = req.body;
  if (name) community.name = name;
  if (description) community.description = description;

  await community.save();
  ApiResponse.success(res, 200, 'Community updated successfully', community);
});

exports.getCommunityById = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const membership = await getMembership(community._id, req.user._id);
  if (!membership && !isSuperadmin(req)) {
    return ApiResponse.error(res, 403, 'You are not a member of this community');
  }

  const members = await CommunityMember.find({ community: community._id }).populate(
    'user', 'name email avatar'
  );

  const totalExpenses = await Transaction.aggregate([
    { $match: { community: community._id, type: 'expense' } },
    { $group: { _id: null, sum: { $sum: '$amount' } } },
  ]);

  ApiResponse.success(res, 200, 'Community fetched', {
    community,
    members,
    totalExpenses: totalExpenses[0]?.sum || 0,
    myRole: membership?.role || (isSuperadmin(req) ? 'superadmin-view' : null),
  });
});

// 🌟 DYNAMIC MONTH FILTER ADDED
exports.getCommunityTransactions = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const membership = await getMembership(community._id, req.user._id);
  if (!membership && !isSuperadmin(req)) {
    return ApiResponse.error(res, 403, 'You are not a member of this community');
  }

  const { month } = req.query; // 'YYYY-MM'
  const query = { community: community._id };

  if (month) {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 1);
    query.date = { $gte: startDate, $lt: endDate };
  }

  const transactions = await Transaction.find(query)
    .populate('owner', 'name email avatar')
    .populate('splitAmong', 'name')
    .sort({ date: -1, createdAt: -1 });

  ApiResponse.success(res, 200, 'Community transactions fetched', transactions);
});

exports.addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  if (String(community.admin) !== String(req.user._id)) {
    return ApiResponse.error(res, 403, 'Only the community owner can add members');
  }

  const exists = await CommunityMember.findOne({ community: community._id, user: userId });
  if (exists) return ApiResponse.error(res, 409, 'User is already a member');

  const member = await CommunityMember.create({ community: community._id, user: userId });

  await Notification.create({
    recipient: userId,
    type: 'community_invite',
    title: 'Added to Community',
    message: `You've been added to "${community.name}".`,
    link: `/community/${community._id}`,
  });

  ApiResponse.success(res, 201, 'Member added', member);
});

exports.removeMember = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  if (String(community.admin) !== String(req.user._id)) {
    return ApiResponse.error(res, 403, 'Only the community owner can remove members');
  }
  if (String(req.params.userId) === String(community.admin)) {
    return ApiResponse.error(res, 400, 'The community owner cannot be removed');
  }

  await CommunityMember.findOneAndDelete({ community: req.params.id, user: req.params.userId });
  ApiResponse.success(res, 200, 'Member removed');
});

exports.updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body; 
  if (!['admin', 'member'].includes(role)) {
    return ApiResponse.error(res, 400, 'Role must be "admin" or "member"');
  }

  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  if (String(community.admin) !== String(req.user._id)) {
    return ApiResponse.error(res, 403, 'Only the community owner can change member roles');
  }
  if (String(req.params.userId) === String(community.admin)) {
    return ApiResponse.error(res, 400, "The owner's role cannot be changed");
  }

  const member = await CommunityMember.findOneAndUpdate(
    { community: req.params.id, user: req.params.userId },
    { role },
    { new: true }
  ).populate('user', 'name email');

  if (!member) return ApiResponse.error(res, 404, 'Member not found in community');

  ApiResponse.success(res, 200, `Member role updated`, member);
});

exports.deleteCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const isOwner = String(community.admin) === String(req.user._id);
  if (!isOwner && !isSuperadmin(req)) {
    return ApiResponse.error(res, 403, 'Only the community owner or Super Admin can delete this community');
  }

  await Promise.all([
    CommunityMember.deleteMany({ community: community._id }),
    Transaction.deleteMany({ community: community._id }),
    community.deleteOne(),
  ]);

  ApiResponse.success(res, 200, 'Community deleted');
});

// 🌟 PERFECT GROSS MATH FOR SPLITTING EXPENSES
exports.addSplitExpense = asyncHandler(async (req, res) => {
  const { amount, description, category = 'Others', splitAmong } = req.body;
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const requesterMembership = await getMembership(community._id, req.user._id);
  if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
    return ApiResponse.error(res, 403, 'Only the community owner or a Community Admin can add expenses');
  }

  if (!splitAmong || !splitAmong.length) {
    return ApiResponse.error(res, 400, 'Select at least one member to split this expense among');
  }

  let members = await CommunityMember.find({ community: community._id });
  const splitMembers = members.filter((m) => splitAmong.includes(String(m.user)));
  if (!splitMembers.length) return ApiResponse.error(res, 400, 'No valid members selected');

  const totalAmount = Number(amount);
  const shareAmount = totalAmount / splitMembers.length;
  const payerMembership = members.find((m) => String(m.user) === String(req.user._id));

  const txn = await Transaction.create({
    owner: req.user._id,
    community: community._id,
    type: 'expense',
    category,
    amount: totalAmount,
    description,
    status: 'completed',
    splitAmong: splitMembers.map((m) => m.user) 
  });

  const modifiedMembers = new Map();

  // 1. Add FULL amount to Payer's Contributed
  if (payerMembership) {
    payerMembership.totalContributed += totalAmount;
    modifiedMembers.set(String(payerMembership.user), payerMembership);
  }

  // 2. Add share amount to EVERYONE's Owed
  splitMembers.forEach((m) => {
    const userIdStr = String(m.user);
    const memberToUpdate = modifiedMembers.get(userIdStr) || m;
    
    memberToUpdate.totalOwed += shareAmount;
    modifiedMembers.set(userIdStr, memberToUpdate);
  });

  for (const member of modifiedMembers.values()) {
    await member.save();
  }

  await Community.findByIdAndUpdate(community._id, {
    $inc: { totalExpenses: totalAmount }
  });

  ApiResponse.success(res, 201, 'Split expense recorded', { transaction: txn, shareAmount });
});

// 🌟 5-MINUTE LOCK & GROSS MATH ROLLBACK IMPLEMENTED
exports.deleteCommunityTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) return ApiResponse.error(res, 404, 'Transaction not found');

  const diffMins = (Date.now() - new Date(transaction.createdAt).getTime()) / (1000 * 60);
  if (diffMins > 5) {
    return ApiResponse.error(res, 400, 'Transactions can only be deleted within 5 minutes of their creation.');
  }

  const communityId = transaction.community;
  if (!communityId) return ApiResponse.error(res, 400, 'This transaction does not belong to a community');

  const community = await Community.findById(communityId);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const requesterMembership = await getMembership(communityId, req.user._id);
  const isOwner = String(community.admin) === String(req.user._id);
  if (!isOwner && (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role))) {
    return ApiResponse.error(res, 403, 'Only the community owner or an admin can delete community transactions');
  }

  const totalAmount = transaction.amount;
  const splitAmong = transaction.splitAmong || [];
  const payerId = transaction.owner; 

  if (splitAmong.length > 0) {
    let members = await CommunityMember.find({ community: community._id });
    const splitMembers = members.filter((m) => splitAmong.includes(String(m.user)));
    
    const shareAmount = totalAmount / splitMembers.length;
    const payerMembership = members.find((m) => String(m.user) === String(payerId));

    const membersToSave = new Map();

    if (payerMembership) {
      payerMembership.totalContributed -= totalAmount;
      membersToSave.set(String(payerMembership.user), payerMembership);
    }

    splitMembers.forEach((m) => {
      const userIdStr = String(m.user);
      const memberToUpdate = membersToSave.get(userIdStr) || m;
      
      memberToUpdate.totalOwed -= shareAmount;
      membersToSave.set(userIdStr, memberToUpdate);
    });

    for (const member of membersToSave.values()) {
      await member.save();
    }
  }

  await Community.findByIdAndUpdate(communityId, {
    $inc: { totalExpenses: -totalAmount }
  });

  await Transaction.findByIdAndDelete(transactionId);
  ApiResponse.success(res, 200, 'Transaction deleted and user balances successfully reset.');
});

// ---------- Pay Request workflow ----------

// 🌟 5-MINUTE WAIT & PROPER PAYABLE MATH (totalPaid/totalReceived)
exports.createSettlementRequest = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const membership = await getMembership(community._id, req.user._id);
  if (!membership) return ApiResponse.error(res, 403, 'You are not a member of this community');

  const latestTxn = await Transaction.findOne({ community: community._id, type: 'expense' }).sort('-createdAt');
  if (latestTxn) {
    const diffMins = (Date.now() - new Date(latestTxn.createdAt).getTime()) / (1000 * 60);
    if (diffMins < 5) {
      const waitTime = Math.ceil(5 - diffMins);
      return ApiResponse.error(res, 400, `Please wait ${waitTime} more minute(s) after the latest expense was added before settling dues to ensure balances are finalized.`);
    }
  }

  let { amount, toUserId } = req.body;
  amount = Number(amount);

  const myPayable = 
    (membership.totalOwed + (membership.totalReceived || 0)) - 
    (membership.totalContributed + (membership.totalPaid || 0));

  if (myPayable <= 0) return ApiResponse.error(res, 400, 'You have no pending dues in this community');
  if (!amount || amount <= 0) return ApiResponse.error(res, 400, 'Enter a valid amount to pay');
  if (amount > myPayable) return ApiResponse.error(res, 400, `Cannot pay more than your payable amount of ₹${myPayable.toFixed(2)}`);
  if (!toUserId) return ApiResponse.error(res, 400, 'Please select a member to send money to');

  const targetUser = await User.findById(toUserId).select('name email');
  if (!targetUser) return ApiResponse.error(res, 400, 'Selected member does not exist');

  const payeeMember = await getMembership(community._id, targetUser._id);
  if (!payeeMember) return ApiResponse.error(res, 400, 'Selected user is not a member of this community');

  if (targetUser._id.equals(req.user._id)) return ApiResponse.error(res, 400, 'You cannot send a payment request to yourself');

  const existingPending = await SettlementRequest.findOne({
    community: community._id,
    fromUser: req.user._id,
    status: 'pending',
  });

  if (existingPending) return ApiResponse.error(res, 409, 'You already have a pending payment request awaiting approval');

  const request = await SettlementRequest.create({
    community: community._id,
    fromUser: req.user._id,
    toUser: targetUser._id,
    amount,
  });

  await Notification.create({
    recipient: targetUser._id,
    type: 'settlement_requested',
    title: 'New Payment Request',
    message: `${req.user.name} wants to pay ₹${amount.toFixed(2)} to you in "${community.name}".`,
    link: `/community`,
  });

  ApiResponse.success(res, 201, 'Payment request sent', request);
});

// 🌟 POPULATE 'toUser' FIX & MONTH FILTERING
exports.getSettlementRequests = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const membership = await getMembership(community._id, req.user._id);
  if (!membership && !isSuperadmin(req)) return ApiResponse.error(res, 403, 'You are not a member of this community');

  const { month } = req.query;
  const query = { community: community._id };

  if (month) {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 1);

    query.$or = [
      { status: 'pending' },
      { 
        status: { $in: ['approved', 'rejected', 'completed'] },
        updatedAt: { $gte: startDate, $lt: endDate }
      }
    ];
  }

  const requests = await SettlementRequest.find(query)
    .populate('fromUser', 'name email avatar')
    .populate({ 
      path: 'toUser', 
      select: 'name email avatar', // FIX: Populating the exact fields for toUser
      model: 'User' 
    })
    .populate('respondedBy', 'name')
    .sort('-createdAt');

  ApiResponse.success(res, 200, 'Settlement requests fetched', requests);
});

// 🌟 totalPaid / totalReceived GROSS MATH & RANDOM TXN GENERATOR
exports.respondToSettlementRequest = asyncHandler(async (req, res) => {
  const { action } = req.body; 
  if (!['approve', 'reject'].includes(action)) return ApiResponse.error(res, 400, 'Action must be "approve" or "reject"');

  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const request = await SettlementRequest.findOne({ _id: req.params.requestId, community: community._id });
  if (!request) return ApiResponse.error(res, 404, 'Payment request not found');

  const isRecipient = String(request.toUser) === String(req.user._id);
  const isOwner = String(community.admin) === String(req.user._id);
  
  if (!isRecipient && !isOwner) return ApiResponse.error(res, 403, 'Only the recipient or owner can respond');
  if (request.status !== 'pending') return ApiResponse.error(res, 400, `This request was already ${request.status}`);

  if (action === 'approve') {
    const payerMembership = await getMembership(community._id, request.fromUser);
    const payeeMembership = await getMembership(community._id, request.toUser);

    if (!payerMembership || !payeeMembership) return ApiResponse.error(res, 404, 'Member no longer belongs to this community');

    const payAmount = request.amount;

    payerMembership.totalPaid += payAmount;
    await payerMembership.save();

    payeeMembership.totalReceived += payAmount;
    await payeeMembership.save();

    const randomTxnNumber = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    await Transaction.create({
      owner: request.fromUser,
      community: null,
      type: 'expense',
      category: 'Community Payment',
      amount: payAmount,
      description: `Settled community dues to ${payeeMembership.user?.name || 'Member'} in: ${community.name}`,
      date: new Date(),
      paymentMode: 'UPI',
      status: 'completed',
      transactionNumber: randomTxnNumber
    });

    request.status = 'approved';
  } else {
    request.status = 'rejected';
  }

  request.respondedBy = req.user._id;
  request.respondedAt = new Date();
  await request.save();

  await Notification.create({
    recipient: request.fromUser,
    type: action === 'approve' ? 'settlement_approved' : 'settlement_rejected',
    title: action === 'approve' ? 'Payment Approved' : 'Payment Rejected',
    message: action === 'approve'
      ? `Your payment of ₹${request.amount.toFixed(2)} in "${community.name}" was approved.`
      : `Your payment request of ₹${request.amount.toFixed(2)} in "${community.name}" was rejected.`,
  });

  ApiResponse.success(res, 200, `Request ${request.status}`, request);
});

exports.cancelSettlementRequest = asyncHandler(async (req, res) => {
  const { id: communityId, requestId } = req.params;
  const request = await SettlementRequest.findOne({ _id: requestId, community: communityId });
  
  if (!request) return ApiResponse.error(res, 404, 'Payment request not found');
  if (String(request.fromUser) !== String(req.user._id)) return ApiResponse.error(res, 403, 'Only the sender can cancel');
  if (request.status !== 'pending') return ApiResponse.error(res, 400, `Cannot cancel because the request is already ${request.status}`);

  await SettlementRequest.findByIdAndDelete(requestId);
  ApiResponse.success(res, 200, 'Payment request cancelled successfully');
});

exports.settleBalance = asyncHandler(async (req, res) => {
  const { userId, amount } = req.body;
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const requesterMembership = await getMembership(community._id, req.user._id);
  if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
    return ApiResponse.error(res, 403, 'Only the community owner or a Community Admin can record settlements');
  }

  const member = await getMembership(community._id, userId);
  if (!member) return ApiResponse.error(res, 404, 'Member not found in community');

  member.totalPaid += amount;
  await member.save();

  ApiResponse.success(res, 200, 'Settlement recorded', member);
});