import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import {
  FaPlus, FaUserFriends, FaUsers, FaMoneyBillWave, FaUserPlus,
  FaTrash, FaCrown, FaUserShield, FaSearch, FaTimesCircle, FaReceipt,
  FaHandHoldingUsd, FaCheck, FaTimes, FaClock, FaHistory
} from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import './community.css';

const COMMUNITY_TYPES = ['Family', 'Office', 'Friends', 'Trip', 'Apartment', 'Hostel', 'College', 'Other'];

const roleBadge = (role) => {
  const map = { owner: 'badge-warning', admin: 'badge-info', member: 'badge-success' };
  return map[role] || 'badge-info';
};

const requestStatusBadge = (status) => {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
  return map[status] || 'badge-info';
};

const Community = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

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
  const [settlementRequests, setSettlementRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm();
  const splitForm = useForm();
  const payForm = useForm();

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

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/communities/${id}`);
      setDetail(data.data);
      setSelectedMemberIds(data.data.members.map((m) => m.user?._id));
      fetchCommunityTransactions(id);
      fetchSettlementRequests(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load community detail');
    }
  };

  const fetchCommunityTransactions = async (id) => {
    setTxnLoading(true);
    try {
      const { data } = await api.get(`/communities/${id}/transactions`);
      setCommunityTxns(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load community transactions');
    } finally {
      setTxnLoading(false);
    }
  };

  const fetchSettlementRequests = async (id) => {
    setRequestsLoading(true);
    try {
      const { data } = await api.get(`/communities/${id}/settlement-requests`);
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

  const toggleSelectedMember = (id) => {
    setSelectedMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    if (!window.confirm(`Remove ${memberName} from this community?`)) return;
    try {
      await api.delete(`/communities/${detail.community._id}/members/${memberUserId}`);
      toast.success('Member removed');
      openDetail(detail.community._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
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
    if (!window.confirm(`Delete "${detail.community.name}"? This removes all its transactions and cannot be undone.`)) return;
    try {
      await api.delete(`/communities/${detail.community._id}`);
      toast.success('Community deleted');
      setDetail(null);
      fetchCommunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete community');
    }
  };

  const myMembership = detail?.members.find((m) => m.user?._id === user?._id);

  const openPayModal = () => {
    if (!myMembership || myMembership.totalOwed <= 0) {
      toast.info("You're all settled up — no pending dues in this community!");
      return;
    }
    payForm.reset({ amount: myMembership.totalOwed.toFixed(2) });
    setPayOpen(true);
  };

  const onSubmitPayRequest = async (formData) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/communities/${detail.community._id}/settlement-requests`, {
        amount: Number(formData.amount),
      });
      if (data.data?.hasPending === false) {
        toast.info('You have no pending dues in this community');
      } else {
        toast.success('Payment request sent — waiting for the owner to approve it');
      }
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
      toast.success(action === 'approve' ? 'Payment approved successfully' : 'Payment request rejected');
      fetchSettlementRequests(detail.community._id);
      openDetail(detail.community._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond to request');
    }
  };

  // ---------- Detail view ----------
  if (detail) {
    const isOwner = detail.myRole === 'owner';
    const isCommunityAdmin = detail.myRole === 'admin';
    const isSuperAdmin = user?.role === 'superadmin';
    const canManageMembers = isOwner;
    const canAddExpense = isOwner || isCommunityAdmin;
    const canDelete = isOwner || isSuperAdmin;

    const pendingRequests = isOwner
      ? settlementRequests.filter((r) => r.status === 'pending')
      : settlementRequests.filter((r) => r.status === 'pending' && r.fromUser?._id === user?._id);

    const completedPayments = settlementRequests.filter((r) => r.status === 'approved' || r.status === 'completed');

    return (
      <div>
        <div className="page-title-row">
          <div>
            <button className="btn btn-outline" onClick={() => { setDetail(null); }} style={{ marginBottom: 12 }}>← Back</button>
            <h1>{detail.community.name}</h1>
            <p className="page-subtitle">
              {detail.community.type} · {detail.members.length} members
              {isSuperAdmin && !isOwner && !isCommunityAdmin && <span className="badge badge-warning" style={{ marginLeft: 10 }}>Oversight View</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {canManageMembers && (
              <motion.button className="btn btn-outline" onClick={() => setAddMemberOpen(true)} whileTap={{ scale: 0.96 }}>
                <FaUserPlus /> Add Member
              </motion.button>
            )}
            {!isOwner && myMembership && (
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
            <p className="page-subtitle">Total Community Expense</p>
            <h2>₹{detail.totalExpenses.toLocaleString()}</h2>
          </div>
          {myMembership && (
            <div className="glass-card" style={{ padding: 20 }}>
              <p className="page-subtitle">Your Balance</p>
              <h2 style={{ color: myMembership.totalOwed > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {myMembership.totalOwed > 0
                  ? `Owes ₹${myMembership.totalOwed.toFixed(2)}`
                  : myMembership.totalOwed < 0
                    ? `Owed ₹${Math.abs(myMembership.totalOwed).toFixed(2)}`
                    : 'All settled up'}
              </h2>
            </div>
          )}
        </div>

        {(pendingRequests.length > 0 || isOwner) && (
          <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>
              <FaClock style={{ marginRight: 8 }} />
              {isOwner ? 'Pending Payment Requests (Action Required)' : 'My Pending Payment Requests'}
            </h3>
            {requestsLoading ? (
              <p className="page-subtitle">Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <p className="page-subtitle">No pending payment requests right now.</p>
            ) : (
              <div className="settlement-request-list">
                {pendingRequests.map((r) => (
                  <div key={r._id} className="settlement-request-item">
                    <div>
                      <p className="notif-title" style={{ fontSize: '0.9rem' }}>
                        {isOwner ? `${r.fromUser?.name} wants to pay` : 'You requested to pay'}
                      </p>
                      <p className="page-subtitle" style={{ fontSize: '0.8rem' }}>Amount: <strong>₹{r.amount.toFixed(2)}</strong></p>
                      <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>{dayjs(r.createdAt).format('DD MMM YYYY, hh:mm A')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isOwner ? (
                        <>
                          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => respondToRequest(r._id, 'approve')}>
                            <FaCheck /> Accept
                          </button>
                          <button className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => respondToRequest(r._id, 'reject')}>
                            <FaTimes /> Reject
                          </button>
                        </>
                      ) : (
                        <span className="badge badge-warning">Waiting for Owner Approval</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Members & Balance Sheet</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Role</th><th>Contributed</th><th>Balance</th>{canManageMembers && <th>Actions</th>}</tr>
              </thead>
              <tbody>
                {detail.members.map((m) => (
                  <tr key={m._id}>
                    <td data-label="Name">{m.user?.name}</td>
                    <td data-label="Role">
                      <span className={`badge ${roleBadge(m.role)}`}>
                        {m.role === 'owner' && <FaCrown style={{ marginRight: 4 }} />}
                        {m.role === 'admin' && <FaUserShield style={{ marginRight: 4 }} />}
                        {m.role}
                      </span>
                    </td>
                    <td data-label="Contributed">₹{m.totalContributed.toLocaleString()}</td>
                    <td data-label="Balance">
                      <span className={`badge ${m.totalOwed > 0 ? 'badge-danger' : 'badge-success'}`}>
                        {m.totalOwed > 0 ? `Owes ₹${m.totalOwed.toFixed(2)}` : `Owed ₹${Math.abs(m.totalOwed).toFixed(2)}`}
                      </span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
          <h3 style={{ marginBottom: 16 }}><FaReceipt style={{ marginRight: 8 }} />Community Transactions</h3>
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
                </tr>
              </thead>
              <tbody>
                {txnLoading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : communityTxns.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No expenses recorded yet</td></tr>
                ) : communityTxns.map((t) => {
                  const involvedCount = t.splitAmong?.length || 1;
                  const splitPerPerson = (t.amount / involvedCount).toFixed(2);
                  // Renders populated names properly
                  const involvedNames = t.splitAmong?.map(u => u.name || 'Unknown').join(', ') || `${involvedCount} members`;

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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
          <h3 style={{ marginBottom: 16 }}><FaHistory style={{ marginRight: 8 }} />Paid Transactions History</h3>
          <p className="page-subtitle" style={{ marginTop: -10, marginBottom: 16 }}>
            Record of all accepted payments and settlements within the community.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member Who Paid</th>
                  <th>Amount Paid</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedPayments.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No payments have been recorded yet.</td></tr>
                ) : completedPayments.map(p => (
                  <tr key={p._id}>
                    <td data-label="Member Who Paid"><strong>{p.fromUser?.name || 'Unknown'}</strong></td>
                    <td data-label="Amount Paid" style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td data-label="Date & Time">{dayjs(p.updatedAt || p.createdAt).format('DD MMM YYYY, hh:mm A')}</td>
                    <td data-label="Status"><span className="badge badge-success">Accepted by Owner</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
              <input className="form-input" type="number" step="0.01" {...splitForm.register('amount', { required: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" {...splitForm.register('description')} />
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
              You owe <strong>₹{myMembership?.totalOwed.toFixed(2)}</strong>. Enter how much you'd like to pay.
              The community owner needs to accept it before your balance updates.
            </p>
            <div className="form-group">
              <label className="form-label">Amount to Pay</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                max={myMembership?.totalOwed}
                {...payForm.register('amount', {
                  required: true,
                  min: { value: 0.01, message: 'Must be greater than 0' },
                  max: { value: myMembership?.totalOwed || 0, message: "Can't exceed what you owe" },
                })}
              />
            </div>
          </form>
        </Modal>

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
                  <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>{u.email}</p>
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
            <input className="form-input" {...register('name', { required: true })} />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" {...register('type')}>
              {COMMUNITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows="3" {...register('description')} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Community;