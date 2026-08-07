const asyncHandler = require('express-async-handler');
const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');

// ---------- helpers ----------

const getMembership = (communityId, userId) =>
  CommunityMember.findOne({ community: communityId, user: userId });

const isSuperadmin = (req) => req.user.role === 'superadmin';

// ---------- controllers ----------

// @desc    List communities. Super Admin sees everything (oversight only).
//          Everyone else sees only communities they belong to.
// @route   GET /api/communities
// @access  Private
exports.getCommunities = asyncHandler(async (req, res) => {
  let communities;
  if (isSuperadmin(req)) {
    communities = await Community.find().populate('admin', 'name email');
  } else {
    const memberships = await CommunityMember.find({ user: req.user._id }).select('community role');
    const ids = memberships.map((m) => m.community);
    communities = await Community.find({ _id: { $in: ids } });
    // attach the requester's own role in each community for the UI
    const roleMap = Object.fromEntries(memberships.map((m) => [String(m.community), m.role]));
    communities = communities.map((c) => ({ ...c.toObject(), myRole: roleMap[String(c._id)] }));
  }
  ApiResponse.success(res, 200, 'Communities fetched', communities);
});

// @desc    Create a community. Creator automatically becomes the Owner.
// @route   POST /api/communities
// @access  Private (any authenticated user)
exports.createCommunity = asyncHandler(async (req, res) => {
  const { name, type, description } = req.body;
  const community = await Community.create({ name, type, description, admin: req.user._id });

  await CommunityMember.create({ community: community._id, user: req.user._id, role: 'owner' });

  ApiResponse.success(res, 201, 'Community created', community);
});

// @desc    Get community detail with members & balance sheet.
//          Only members of the community, or the Super Admin (oversight), may view.
// @route   GET /api/communities/:id
// @access  Private
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

// @desc    List a community's transactions. Members only (or Super Admin oversight).
// @route   GET /api/communities/:id/transactions
// @access  Private
exports.getCommunityTransactions = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return ApiResponse.error(res, 404, 'Community not found');

  const membership = await getMembership(community._id, req.user._id);
  if (!membership && !isSuperadmin(req)) {
    return ApiResponse.error(res, 403, 'You are not a member of this community');
  }

  const transactions = await Transaction.find({ community: community._id })
    .populate('owner', 'name email avatar')
    .sort('-date');

  ApiResponse.success(res, 200, 'Community transactions fetched', transactions);
});

// @desc    Add member to community — Owner only.
// @route   POST /api/communities/:id/members
// @access  Private (community owner)
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

// @desc    Remove member from community — Owner only.
// @route   DELETE /api/communities/:id/members/:userId
// @access  Private (community owner)
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

// @desc    Promote or demote a member's community role — Owner only.
// @route   PATCH /api/communities/:id/members/:userId/role
// @access  Private (community owner)
exports.updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body; // 'admin' | 'member'
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

  ApiResponse.success(res, 200, `Member ${role === 'admin' ? 'promoted to Community Admin' : 'set back to Member'}`, member);
});

// @desc    Delete a community entirely — Owner or Super Admin only.
// @route   DELETE /api/communities/:id
// @access  Private (owner, superadmin)
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

// @desc    Add a split (shared) expense to a community, choosing which members are involved.
//          Restricted to the community Owner and promoted Community Admins.
// @route   POST /api/communities/:id/split-expense
// @access  Private (owner, community-admin)
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

  const shareAmount = Number(amount) / splitMembers.length;
  const payerMembership = members.find((m) => String(m.user) === String(req.user._id));
  const payerIncludedInSplit = splitMembers.some((m) => String(m.user) === String(req.user._id));

  const txn = await Transaction.create({
    owner: req.user._id,
    community: community._id,
    type: 'expense',
    category,
    amount,
    description,
    status: 'completed',
  });

  // The payer fronted the full amount out of pocket — that always counts as a contribution,
  // whether or not the payer is one of the people the cost is being split among.
  if (payerMembership) {
    payerMembership.totalContributed += Number(amount);
  }

  await Promise.all(
    splitMembers.map(async (m) => {
      const isPayer = String(m.user) === String(req.user._id);
      if (isPayer) {
        m.totalOwed -= amount - shareAmount; // payer already covered their own share by paying upfront
        return m.save();
      }
      m.totalOwed += shareAmount; // this member now owes the payer their share
      return m.save();
    })
  );

  // If the payer fronted the money but isn't one of the people splitting the cost
  // (e.g. paid entirely on behalf of others), they're owed the full amount back.
  // (If the payer IS in splitMembers, they're the same document instance already
  // saved inside the loop above, so no extra save is needed here.)
  if (payerMembership && !payerIncludedInSplit) {
    payerMembership.totalOwed -= Number(amount);
    await payerMembership.save();
  }

  ApiResponse.success(res, 201, 'Split expense recorded', { transaction: txn, shareAmount, payerIncluded: payerIncludedInSplit });
});

// @desc    Settle up a member's balance — Owner or Community Admin only.
// @route   POST /api/communities/:id/settle
// @access  Private (owner, community-admin)
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

  member.totalOwed -= amount;
  member.totalContributed += amount;
  await member.save();

  await Notification.create({
    recipient: userId,
    type: 'settlement_pending',
    title: 'Settlement Recorded',
    message: `A settlement of ${amount} has been recorded for you.`,
  });

  ApiResponse.success(res, 200, 'Settlement recorded', member);
});
