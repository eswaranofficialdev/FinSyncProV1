import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import {
  FaPlus, FaUserFriends, FaUsers, FaMoneyBillWave, FaUserPlus,
  FaTrash, FaCrown, FaUserShield, FaSearch, FaTimesCircle, FaReceipt,
  FaHandHoldingUsd, FaCheck, FaTimes, FaClock, FaHistory, FaCalendarAlt,
  FaEdit
} from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import './community.css';

const COMMUNITY_TYPES = ['Family', 'Office', 'Friends', 'Trip', 'Apartment', 'Hostel', 'College', 'Other'];
const CATEGORIES = ['Salary', 'Shopping', 'Bills', 'Travel', 'Health', 'Education', 'Investment', 'Loan', 'Savings', 'Food', 'Rent', 'Entertainment', 'Others'];

const roleBadge = (role) => {
  const map = { owner: 'badge-warning', admin: 'badge-info', member: 'badge-success' };
  return map[role] || 'badge-info';
};

const Community = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [detail, setDetail] = useState(null);
  const [communityTxns, setCommunityTxns] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const [payOpen, setPayOpen] = useState(false);
  const [selectedPayeeId, setSelectedPayeeId] = useState('');
  const [settlementRequests, setSettlementRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [activeTab, setActiveTab] = useState('expenses');
  const [showReport, setShowReport] = useState(false);

  // Custom Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: '',
    onConfirm: () => {},
  });

  const confirm = (message, onConfirm, title = 'Are you sure?') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const { register, handleSubmit, reset, formState: { errors: createErrors } } = useForm({ mode: 'onChange' });
  const splitForm = useForm({ mode: 'onChange' });
  const payForm = useForm();
  const editForm = useForm({ mode: 'onChange' });

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/communities');
      setCommunities(data.data);
    } catch {
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  useEffect(() => {
    if (detail?.community?._id) {
      fetchCommunityTransactions(detail.community._id, selectedMonth);
      fetchSettlementRequests(detail.community._id, selectedMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const onCreate = async (formData) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/communities', formData);
      toast.success('Community created — you are the Owner');
      setCreateOpen(false);
      reset();
      fetchCommunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create community');
    } finally {
      setSubmitting(false);
    }
  };

  const onEditCommunity = async (formData) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.put(`/communities/${detail.community._id}`, formData);
      toast.success('Community updated');
      setEditOpen(false);
      openDetail(detail.community._id);
      fetchCommunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update community');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/communities/${id}`);
      setDetail(data.data);
      setSelectedMemberIds(data.data.members.map((m) => m.user?._id));
      setShowReport(false);
      fetchCommunityTransactions(id, selectedMonth);
      fetchSettlementRequests(id, selectedMonth);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load community detail');
    }
  };

  const fetchCommunityTransactions = async (id, monthStr = selectedMonth) => {
    setTxnLoading(true);
    try {
      const { data } = await api.get(`/communities/${id}/transactions?month=${monthStr}`);
      setCommunityTxns(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setTxnLoading(false);
    }
  };

  const fetchSettlementRequests = async (id, monthStr = selectedMonth) => {
    setRequestsLoading(true);
    try {
      const { data } = await api.get(`/communities/${id}/settlement-requests?month=${monthStr}`);
      setSettlementRequests(data.data);
    } catch (err) {
      // non-fatal
    } finally {
      setRequestsLoading(false);
    }
  };

  const onSplitExpense = async (formData) => {
    if (submitting) return;
    if (selectedMemberIds.length === 0) {
      toast.error('Select at least one member to split this expense among');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/communities/${detail.community._id}/split-expense`, {
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category || 'Others',
        splitAmong: selectedMemberIds,
      });
      toast.success('Split expense recorded');
      setSplitOpen(false);
      splitForm.reset();
      openDetail(detail.community._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add split expense');
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteTransaction = async (txnId) => {
    confirm(
      'Delete this community transaction? Split shares and balances will be successfully reversed.',
      async () => {
        try {
          await api.delete(`/communities/transactions/${txnId}`);
          toast.success('Transaction deleted and balances recalculated');
          openDetail(detail.community._id);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete transaction');
        }
      },
      'Delete Transaction'
    );
  };

  const toggleSelectedMember = (id) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 10) {
        toast.warning('You can select a maximum of 10 members only.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get('/users/search', { params: { q: val } });
        const existingIds = new Set(detail.members.map((m) => m.user?._id));
        setSearchResults(data.data.filter((u) => !existingIds.has(u._id)));
      } catch {
        toast.error('Search failed');
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const onAddMember = async (userId) => {
    try {
      await api.post(`/communities/${detail.community._id}/members`, { userId });
      toast.success('Member added');
      setAddMemberOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      openDetail(detail.community._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const onRemoveMember = async (memberUserId, memberName) => {
    confirm(
      `Remove ${memberName} from this community?`,
      async () => {
        try {
          await api.delete(`/communities/${detail.community._id}/members/${memberUserId}`);
          toast.success('Member removed');
          openDetail(detail.community._id);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to remove member');
        }
      },
      'Remove Member'
    );
  };

  const onChangeRole = async (memberUserId, role) => {
    try {
      await api.patch(`/communities/${detail.community._id}/members/${memberUserId}/role`, { role });
      toast.success(role === 'admin' ? 'Promoted to Community Admin' : 'Set back to Member');
      openDetail(detail.community._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const onDeleteCommunity = async () => {
    confirm(
      `Delete "${detail.community.name}"? This removes all its transactions and cannot be undone.`,
      async () => {
        try {
          await api.delete(`/communities/${detail.community._id}`);
          toast.success('Community deleted');
          setDetail(null);
          fetchCommunities();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete community');
        }
      },
      'Delete Community'
    );
  };

  const myMembership = detail?.members.find((m) => m.user?._id === user?._id);
  const myPayableRaw = myMembership
    ? (myMembership.totalOwed + (myMembership.totalReceived || 0)) - (myMembership.totalContributed + (myMembership.totalPaid || 0))
    : 0;
  const myPayable = Math.max(0, myPayableRaw);

  const openPayModal = () => {
    if (myPayable <= 0) {
      toast.info("You're all settled up — no payable amount available!");
      return;
    }
    setSelectedPayeeId('');
    payForm.reset({ amount: myPayable.toFixed(2) });
    setPayOpen(true);
  };

  const onSubmitPayRequest = async (formData) => {
    if (submitting) return;
    if (!selectedPayeeId) {
      toast.error('Please select a member to send money to');
      return;
    }

    const selectedPayee = detail.members.find(m => m.user?._id === selectedPayeeId);
    if (selectedPayee) {
      const payeeRawPayable = (selectedPayee.totalOwed + (selectedPayee.totalReceived || 0)) - (selectedPayee.totalContributed + (selectedPayee.totalPaid || 0));
      if (payeeRawPayable >= 0) {
        toast.error('Selected user does not collect money (they do not have a negative payable balance)');
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post(`/communities/${detail.community._id}/settlement-requests`, {
        amount: Number(formData.amount),
        toUserId: selectedPayeeId,
      });
      toast.success('Payment request sent to the selected member');
      setPayOpen(false);
      fetchSettlementRequests(detail.community._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send payment request');
    } finally {
      setSubmitting(false);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await api.patch(`/communities/${detail.community._id}/settlement-requests/${requestId}`, { action });
      toast.success(action === 'approve' ? 'Payment accepted successfully' : 'Payment request rejected');
      fetchSettlementRequests(detail.community._id);
      openDetail(detail.community._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond to request');
    }
  };

  const cancelRequest = async (requestId) => {
    confirm(
      'Are you sure you want to cancel this payment request?',
      async () => {
        try {
          await api.delete(`/communities/${detail.community._id}/settlement-requests/${requestId}`);
          toast.success('Payment request cancelled');
          fetchSettlementRequests(detail.community._id);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to cancel request');
        }
      },
      'Cancel Request'
    );
  };

  // ---------- Detail view ----------
  if (detail) {
    const isOwner = detail.myRole === 'owner';
    const isCommunityAdmin = detail.myRole === 'admin';
    const isSuperAdmin = user?.role === 'superadmin';
    const canManageMembers = isOwner;
    const canAddExpense = isOwner || isCommunityAdmin;
    const canDelete = isOwner || isSuperAdmin;
    const canManageTransactions = isOwner || isCommunityAdmin;

    const currentMonthTxns = communityTxns.filter(t => dayjs(t.date).format('YYYY-MM') === selectedMonth);
    const monthlyTotalExpense = currentMonthTxns.reduce((sum, t) => sum + t.amount, 0);

    const pendingRequests = settlementRequests.filter((r) => r.status === 'pending');

    const completedPayments = settlementRequests.filter((r) => r.status === 'approved' || r.status === 'completed');
    const currentMonthPayments = completedPayments.filter(p => dayjs(p.updatedAt || p.createdAt).format('YYYY-MM') === selectedMonth);

    return (
      <div>
        {!showReport ? (
          <>
            <div className="page-title-row">
              <div>
                <button className="btn btn-outline" onClick={() => { setDetail(null); }} style={{ marginBottom: 12 }}>← Back</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ margin: 0 }}>{detail.community.name}</h1>
                  {isOwner && (
                    <button
                      className="icon-btn"
                      onClick={() => {
                        editForm.reset({ name: detail.community.name, description: detail.community.description });
                        setEditOpen(true);
                      }}
                      title="Edit Community"
                    >
                      <FaEdit style={{ color: 'var(--color-primary)' }} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <p className="page-subtitle" style={{ margin: 0 }}>
                    {detail.community.type} · {detail.members.length} members
                    {isSuperAdmin && !isOwner && !isCommunityAdmin && <span className="badge badge-warning" style={{ marginLeft: 10 }}>Oversight View</span>}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(58, 58, 73, 0.1)', padding: '4px 8px', borderRadius: 8 }}>
                    <FaCalendarAlt size={14} color="var(--color-primary)" />
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedMonth(e.target.value);
                        }
                      }}
                      style={{ border: 'none', background: 'transparent', color: 'inherit', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {canManageMembers && (
                  <motion.button className="btn btn-outline" onClick={() => setAddMemberOpen(true)} whileTap={{ scale: 0.96 }}>
                    <FaUserPlus /> Add Member
                  </motion.button>
                )}
                {myMembership && myPayable > 0 && (
                  <motion.button className="btn btn-outline" onClick={openPayModal} whileTap={{ scale: 0.96 }}>
                    <FaHandHoldingUsd /> Pay Dues
                  </motion.button>
                )}
                {canAddExpense && (
                  <motion.button className="btn btn-primary" onClick={() => setSplitOpen(true)} whileTap={{ scale: 0.96 }}>
                    <FaMoneyBillWave /> Split Expense
                  </motion.button>
                )}
                {canDelete && (
                  <motion.button className="btn btn-danger" onClick={onDeleteCommunity} whileTap={{ scale: 0.96 }}>
                    <FaTrash /> Delete
                  </motion.button>
                )}
              </div>
            </div>

            <div className="stat-grid" style={{ marginBottom: 20 }}>
              <div className="glass-card" style={{ padding: 20 }}>
                <p className="page-subtitle">Community Expense ({dayjs(selectedMonth).format('MMM YYYY')})</p>
                <h2>₹{monthlyTotalExpense.toLocaleString()}</h2>
              </div>
              {myMembership && (
                <div className="glass-card" style={{ padding: 20 }}>
                  <p className="page-subtitle">Your Lifetime Balance</p>
                  <h2 style={{ color: myPayableRaw > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {myPayableRaw > 0
                      ? `Payable ₹${myPayableRaw.toFixed(2)}`
                      : myPayableRaw < 0
                        ? `Collect ₹${Math.abs(myPayableRaw).toFixed(2)}`
                        : 'All settled up'}
                  </h2>
                </div>
              )}
            </div>

            {pendingRequests.length > 0 && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                <h3 style={{ marginBottom: 16 }}>
                  <FaClock style={{ marginRight: 8 }} />
                  Payment Requests & Approvals
                </h3>
                <div className="settlement-request-list">
                  {pendingRequests.map((r) => {
                    const isRecipient = r.toUser?._id === user?._id;
                    return (
                      <div key={r._id} className="settlement-request-item">
                        <div>
                          <p className="notif-title" style={{ fontSize: '0.9rem' }}>
                            {isRecipient
                              ? `${r.fromUser?.name || 'A member'} wants to pay you`
                              : `You requested to pay ${r.toUser?.name || 'a member'}`}
                          </p>
                          <p className="page-subtitle" style={{ fontSize: '0.8rem' }}>Amount: <strong>₹{r.amount.toFixed(2)}</strong></p>
                          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>{dayjs(r.createdAt).format('DD MMM YYYY, hh:mm A')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {isRecipient ? (
                            <>
                              <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => respondToRequest(r._id, 'approve')}>
                                <FaCheck /> Accept
                              </button>
                              <button className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => respondToRequest(r._id, 'reject')}>
                                <FaTimes /> Reject
                              </button>
                            </>
                          ) : (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span className="badge badge-warning">Waiting for Approval</span>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                onClick={() => cancelRequest(r._id)}
                                title="Cancel Request"
                              >
                                <FaTimes style={{ marginRight: 4 }} /> Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Members & Balance Sheet</h3>
                <button className="btn btn-outline" onClick={() => setShowReport(true)} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                  <FaReceipt style={{ marginRight: 6 }} /> Monthly Report
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Total Spent ({dayjs(selectedMonth).format('MMM YYYY')})</th>
                      <th>Payable / Collect (Lifetime)</th>
                      {canManageMembers && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.members.map((m) => {
                      const rawPayable = (m.totalOwed + (m.totalReceived || 0)) - (m.totalContributed + (m.totalPaid || 0));
                      const isNegative = rawPayable < 0;
                      const displayPayable = Math.max(0, rawPayable);

                      const monthlySpent = currentMonthTxns
                        .filter(t => (t.owner?._id || t.owner) === m.user?._id)
                        .reduce((sum, t) => sum + t.amount, 0);

                      return (
                        <tr key={m._id}>
                          <td data-label="Name">{m.user?.name}</td>
                          <td data-label="Role">
                            <span className={`badge ${roleBadge(m.role)}`}>
                              {m.role === 'owner' && <FaCrown style={{ marginRight: 4 }} />}
                              {m.role === 'admin' && <FaUserShield style={{ marginRight: 4 }} />}
                              {m.role}
                            </span>
                          </td>
                          <td data-label={`Total Spent (${dayjs(selectedMonth).format('MMM')})`}>
                            ₹{monthlySpent.toLocaleString()}
                          </td>
                          <td data-label="Payable / Collect (Lifetime)">
                            {isNegative ? (
                              <span className="badge badge-warning" style={{ fontWeight: 'bold' }}>
                                Collect ₹{Math.abs(rawPayable).toFixed(2)}
                              </span>
                            ) : rawPayable > 0 ? (
                              <strong style={{ color: 'var(--color-danger)' }}>Payable ₹{displayPayable.toFixed(2)}</strong>
                            ) : (
                              <strong style={{ color: 'var(--color-success)' }}>Settled</strong>
                            )}
                          </td>
                          {canManageMembers && (
                            <td data-label="Actions">
                              {m.role !== 'owner' && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {m.role === 'member' ? (
                                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => onChangeRole(m.user?._id, 'admin')}>
                                      Make Admin
                                    </button>
                                  ) : (
                                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => onChangeRole(m.user?._id, 'member')}>
                                      Remove Admin
                                    </button>
                                  )}
                                  <button className="icon-btn" title="Remove member" onClick={() => onRemoveMember(m.user?._id, m.user?.name)}>
                                    <FaTrash />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('expenses')}
              >
                <FaReceipt style={{ marginRight: 6 }} /> Community Expenses
              </button>
              <button
                className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('payments')}
              >
                <FaHistory style={{ marginRight: 6 }} /> Paid Transactions
              </button>
            </div>

            {activeTab === 'expenses' && (
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16 }}>Community Expenses ({dayjs(selectedMonth).format('MMMM YYYY')})</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Paid By</th>
                        <th>Involved Members</th>
                        <th>Split / Member</th>
                        <th>Date & Time</th>
                        {canManageTransactions && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {txnLoading ? (
                        <tr><td colSpan={canManageTransactions ? 7 : 6} style={{ textAlign: 'center' }}>Loading expenses...</td></tr>
                      ) : currentMonthTxns.length === 0 ? (
                        <tr><td colSpan={canManageTransactions ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No expenses recorded this month</td></tr>
                      ) : currentMonthTxns.map((t) => {
                        const involvedCount = t.splitAmong?.length || 1;
                        const splitPerPerson = (t.amount / involvedCount).toFixed(2);
                        const involvedNames = t.splitAmong?.map(u => u.name || 'Unknown').join(', ') || `${involvedCount} members`;

                        const canDeleteTxn = dayjs().diff(dayjs(t.createdAt), 'minute') <= 5;

                        return (
                          <tr key={t._id}>
                            <td data-label="Description">
                              {t.description || '(no description)'}
                              <br /><span className="badge badge-info" style={{ marginTop: 4, display: 'inline-block' }}>{t.category}</span>
                            </td>
                            <td data-label="Amount"><strong>₹{t.amount.toLocaleString()}</strong></td>
                            <td data-label="Paid By">{t.owner?.name || 'Unknown'}</td>
                            <td data-label="Involved Members" style={{ fontSize: '0.85rem' }}>{involvedNames}</td>
                            <td data-label="Split / Member" style={{ color: 'var(--color-danger)' }}>₹{splitPerPerson}</td>
                            <td data-label="Date & Time">{dayjs(t.date).format('DD MMM YYYY, hh:mm A')}</td>
                            {canManageTransactions && (
                              <td data-label="Actions">
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {canDeleteTxn ? (
                                    <button className="icon-btn" title="Delete Transaction (Within 5 mins)" onClick={() => onDeleteTransaction(t._id)}>
                                      <FaTrash />
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Locked</span>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16 }}>Paid Transactions ({dayjs(selectedMonth).format('MMMM YYYY')})</h3>
                <p className="page-subtitle" style={{ marginTop: -10, marginBottom: 16 }}>
                  Record of all accepted payments and settlements within the community.
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Member Who Paid</th>
                        <th>Paid To (Recipient)</th>
                        <th>Amount Paid</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestsLoading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading payments...</td></tr>
                      ) : currentMonthPayments.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No payments recorded this month.</td></tr>
                      ) : currentMonthPayments.map(p => (
                        <tr key={p._id}>
                          <td data-label="Member Who Paid"><strong>{p.fromUser?.name || 'Unknown'}</strong></td>
                          <td data-label="Paid To"><strong>{p.toUser?.name || 'Community Creditor'}</strong></td>
                          <td data-label="Amount Paid" style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                            ₹{p.amount.toFixed(2)}
                          </td>
                          <td data-label="Date & Time">{dayjs(p.updatedAt || p.createdAt).format('DD MMM YYYY, hh:mm A')}</td>
                          <td data-label="Status"><span className="badge badge-success">Accepted</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* 🌟 DETAILED MONTHLY REPORT VIEW 🌟 */
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="page-title-row">
              <div>
                <button className="btn btn-outline" onClick={() => setShowReport(false)} style={{ marginBottom: 12 }}>← Back to Dashboard</button>
                <h1>Monthly Expense Report</h1>
                <p className="page-subtitle">{detail.community.name} - Breakdown</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 8 }}>
                <FaCalendarAlt size={14} color="var(--color-primary)" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      setSelectedMonth(value);
                    }
                  }}
                  style={{ border: 'none', background: 'transparent', color: 'inherit', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Member Expenses ({dayjs(selectedMonth).format('MMMM YYYY')})</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Total Spend (Community)</th>
                      <th>Total Owes (Their Share)</th>
                      <th>Total Expense</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txnLoading ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading month data...</td></tr>
                    ) : detail.members.map((m) => {
                      const spend = currentMonthTxns
                        .filter(t => (t.owner?._id || t.owner) === m.user?._id)
                        .reduce((sum, t) => sum + t.amount, 0);

                      const owes = currentMonthTxns
                        .filter(t => t.splitAmong?.some(u => (u._id || u) === m.user?._id))
                        .reduce((sum, t) => sum + (t.amount / (t.splitAmong?.length || 1)), 0);

                      const expense = owes - spend;

                      return (
                        <tr key={m._id}>
                          <td data-label="Name">{m.user?.name}</td>
                          <td data-label="Total Spend">₹{spend.toFixed(2)}</td>
                          <td data-label="Total Owes">₹{owes.toFixed(2)}</td>
                          <td data-label="Total Expense" style={{ color: expense > 0 ? 'var(--color-danger)' : expense < 0 ? 'var(--color-success)' : 'inherit', fontWeight: 'bold' }}>
                            {expense > 0 ? `Owes ₹${expense.toFixed(2)}` : expense < 0 ? `Collects ₹${Math.abs(expense).toFixed(2)}` : '₹0.00'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Settlements & Payments ({dayjs(selectedMonth).format('MMMM YYYY')})</h3>

              {requestsLoading ? (
                <p style={{ textAlign: 'center', margin: 20 }}>Loading payment history...</p>
              ) : currentMonthPayments.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 20 }}>No payments recorded for this month.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Paid By</th>
                        <th>Paid To</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMonthPayments.map(p => (
                        <tr key={p._id}>
                          <td data-label="Date">{dayjs(p.updatedAt || p.createdAt).format('DD MMM, hh:mm A')}</td>
                          <td data-label="Paid By"><strong>{p.fromUser?.name || 'Unknown'}</strong></td>
                          <td data-label="Paid To"><strong>{p.toUser?.name || 'Community Creditor'}</strong></td>
                          <td data-label="Amount" style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                            ₹{p.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- MODALS --- */}

        {/* Custom Confirmation Modal Component */}
        <Modal
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
          title={confirmConfig.title}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmConfig.onConfirm}>
                Confirm
              </button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main, #333)', lineHeight: 1.5 }}>
            {confirmConfig.message}
          </p>
        </Modal>

        {/* Edit Community Modal */}
        <Modal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Community"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={editForm.handleSubmit(onEditCommunity)} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <form onSubmit={editForm.handleSubmit(onEditCommunity)}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                {...editForm.register('name', {
                  required: 'Community name is required',
                  minLength: { value: 3, message: 'Minimum 3 characters required' },
                  maxLength: { value: 20, message: 'Maximum 20 characters allowed' }
                })}
              />
              {editForm.formState.errors.name && (
                <span className="form-error">{editForm.formState.errors.name.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows="3"
                {...editForm.register('description', {
                  required: 'Description is required',
                  minLength: { value: 3, message: 'Minimum 3 characters required' },
                  maxLength: { value: 50, message: 'Maximum 50 characters allowed' }
                })}
              />
              {editForm.formState.errors.description && (
                <span className="form-error">{editForm.formState.errors.description.message}</span>
              )}
            </div>
          </form>
        </Modal>

        {/* Split Expense Modal */}
        <Modal
          isOpen={splitOpen}
          onClose={() => setSplitOpen(false)}
          title="Split Expense"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setSplitOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={splitForm.handleSubmit(onSplitExpense)} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Expense'}
              </button>
            </>
          }
        >
          <form onSubmit={splitForm.handleSubmit(onSplitExpense)}>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                {...splitForm.register('amount', {
                  required: 'Amount is required',
                  min: { value: 1, message: 'Minimum amount is 1' },
                  max: { value: 999999, message: 'Maximum 6 digits allowed' }
                })}
              />
              {splitForm.formState.errors.amount && (
                <span className="form-error">{splitForm.formState.errors.amount.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" {...splitForm.register('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                {...splitForm.register('description', {
                  maxLength: { value: 50, message: 'Maximum 50 characters allowed' },
                  validate: (value) => {
                    const text = value?.trim() || '';
                    if (!text) return true;
                    const hasLongWord = /\S{20,}/.test(text);
                    if (hasLongWord) {
                      return 'Please add spaces between words.';
                    }
                    return true;
                  }
                })}
              />
              {splitForm.formState.errors.description && (
                <span className="form-error">{splitForm.formState.errors.description.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Split Among ({selectedMemberIds.length} selected)</label>
              <div className="member-checklist">
                {detail.members.map((m) => (
                  <label key={m._id} className="member-check-item">
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(m.user?._id)}
                      onChange={() => toggleSelectedMember(m.user?._id)}
                    />
                    {m.user?.name}
                  </label>
                ))}
              </div>
            </div>
          </form>
        </Modal>

        {/* Pay Dues Modal */}
        <Modal
          isOpen={payOpen}
          onClose={() => setPayOpen(false)}
          title="Pay Community Dues"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setPayOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={payForm.handleSubmit(onSubmitPayRequest)} disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </>
          }
        >
          <form onSubmit={payForm.handleSubmit(onSubmitPayRequest)}>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              Your payable amount is <strong>₹{myPayable.toFixed(2)}</strong>. Select a member who has a negative payable to send money to.
            </p>

            <div className="form-group">
              <label className="form-label">Select Creditor (Payee)</label>
              <select
                className="form-input"
                value={selectedPayeeId}
                onChange={(e) => setSelectedPayeeId(e.target.value)}
              >
                <option value="">-- Choose member to pay --</option>
                {detail.members
                  .filter((m) => m.user?._id !== user?._id)
                  .map((m) => {
                    const rawPayable = (m.totalOwed + (m.totalReceived || 0)) - (m.totalContributed + (m.totalPaid || 0));
                    const isCreditor = rawPayable < 0;
                    return (
                      <option
                        key={m.user?._id}
                        value={m.user?._id}
                      >
                        {m.user?.name} {isCreditor ? `(Collects ₹${Math.abs(rawPayable).toFixed(2)})` : '(No money to collect)'}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount to Pay</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                max={myPayable}
                {...payForm.register('amount', {
                  required: true,
                  min: { value: 0.01, message: 'Must be greater than 0' },
                  max: { value: myPayable || 0, message: "Can't exceed your payable amount" },
                })}
              />
            </div>
          </form>
        </Modal>

        {/* Add Member Modal */}
        <Modal
          isOpen={addMemberOpen}
          onClose={() => { setAddMemberOpen(false); setSearchQuery(''); setSearchResults([]); }}
          title="Add Member"
        >
          <div className="form-group">
            <label className="form-label">Search by UID</label>
            <div className="navbar-search" style={{ maxWidth: '100%' }}>
              <FaSearch />
              <input type='number' placeholder="Start typing..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} />
              {searchQuery && <FaTimesCircle style={{ cursor: 'pointer' }} onClick={() => handleSearchChange('')} />}
            </div>
          </div>

          {searching && <p className="page-subtitle">Searching...</p>}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="page-subtitle">No matching users found</p>
          )}

          <div className="search-results-list">
            {searchResults.map((u) => (
              <div key={u._id} className="search-result-item">
                <div>
                  <p className="notif-title" style={{ fontSize: '0.85rem' }}>{u.name}</p>
                  <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>{u.email} (UID: {u.uid})</p>
                </div>
                <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => onAddMember(u._id)}>
                  Add
                </button>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    );
  }

  // ---------- Main Community List View ----------
  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Community</h1>
          <p className="page-subtitle">Create a community and you become its Owner</p>
        </div>
        <motion.button className="btn btn-primary" onClick={() => setCreateOpen(true)} whileTap={{ scale: 0.96 }}>
          <FaPlus /> New Community
        </motion.button>
      </div>

      {loading ? (
        <p>Loading communities...</p>
      ) : communities.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <FaUserFriends size={40} style={{ marginBottom: 12, color: 'var(--color-primary)' }} />
          <p>No communities yet. Create one to start splitting expenses!</p>
        </div>
      ) : (
        <div className="community-grid">
          {communities.map((c, i) => (
            <motion.div
              key={c._id}
              className="glass-card community-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => openDetail(c._id)}
            >
              <div className="community-icon"><FaUsers /></div>
              <h3>{c.name}</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="badge badge-info">{c.type}</span>
                {c.myRole && <span className={`badge ${roleBadge(c.myRole)}`}>{c.myRole}</span>}
                {user?.role === 'superadmin' && !c.myRole && <span className="badge badge-warning">Oversight</span>}
              </div>
              <p className="page-subtitle" style={{ marginTop: 10 }}>{c.description || 'No description'}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* --- CREATE COMMUNITY MODAL --- */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Community"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit(onCreate)} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onCreate)}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              {...register('name', {
                required: 'Community name is required',
                minLength: { value: 3, message: 'Minimum 3 characters required' },
                maxLength: { value: 20, message: 'Maximum 20 characters allowed' }
              })}
            />
            {createErrors.name && (
              <span className="form-error">{createErrors.name.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" {...register('type')}>
              {COMMUNITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows="3"
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 3, message: 'Minimum 3 characters required' },
                maxLength: { value: 30, message: 'Maximum 30 characters allowed' }
              })}
            />
            {createErrors.description && (
              <span className="form-error">{createErrors.description.message}</span>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Community;