import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { FaBan, FaCheckCircle, FaTrash, FaSearch, FaSpinner } from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal'; // Importing your existing reusable modal
import './listPage.css';

const statusBadge = (status) => {
  const map = { active: 'badge-success', suspended: 'badge-danger', rejected: 'badge-danger' };
  return map[status] || 'badge-info';
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Loading states
  const [togglingId, setTogglingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom Confirmation Modal State (Reused pattern)
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
      onConfirm: async () => {
        setIsDeleting(true); // Disable buttons while processing
        await onConfirm();
        setIsDeleting(false);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false })); // Close modal after success
      },
    });
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { search, page, limit: 10 } });
      setUsers(data.data);
      setPages(data.meta.pages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (u) => {
    setTogglingId(u._id); // Disable only this row's button
    const newStatus = u.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.patch(`/users/${u._id}/status`, { status: newStatus });
      toast.success(`User ${newStatus}`);
      fetchUsers();
    } catch {
      toast.error('Action failed');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteUser = (u) => {
    confirm(
      `Delete ${u.name}? This cannot be undone.`,
      async () => {
        try {
          await api.delete(`/users/${u._id}`);
          toast.success('User deleted');
          fetchUsers();
        } catch {
          toast.error('Delete failed');
        }
      },
      'Delete User'
    );
  };

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Users</h1>
          <p className="page-subtitle">
            Platform-wide oversight — account status only. Personal transactions stay private and are never shown here.
          </p>
        </div>
      </div>

      <div className="glass-card filter-bar">
        <div className="navbar-search" style={{ maxWidth: 320 }}>
          <FaSearch />
          <input 
            placeholder="Search name or email..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
          />
        </div>
      </div>

      <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20, marginTop: 16 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u._id}>
                  <td data-label="Name">{u.name}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Status"><span className={`badge ${statusBadge(u.status)}`}>{u.status}</span></td>
                  <td data-label="Last Login">{u.lastLogin ? dayjs(u.lastLogin).format('DD MMM YYYY, hh:mm A') : 'Never'}</td>
                  <td data-label="Actions">
                    {/* Toggle Button */}
                    <button 
                      className="icon-btn" 
                      title={u.status === 'suspended' ? 'Activate' : 'Suspend'} 
                      onClick={() => toggleStatus(u)}
                      disabled={togglingId === u._id}
                      style={{ opacity: togglingId === u._id ? 0.5 : 1, cursor: togglingId === u._id ? 'not-allowed' : 'pointer' }}
                    >
                      {togglingId === u._id ? <FaSpinner className="fa-spin" /> : (u.status === 'suspended' ? <FaCheckCircle /> : <FaBan />)}
                    </button>
                    
                    {/* Delete Button */}
                    <button 
                      className="icon-btn" 
                      title="Delete" 
                      onClick={() => deleteUser(u)}
                      disabled={togglingId === u._id}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="pagination">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Reusable Custom Confirmation Modal */}
      <Modal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        footer={
          <>
            <button 
              className="btn btn-outline" 
              onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger" 
              onClick={confirmConfig.onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main, #333)', lineHeight: 1.5 }}>
          {confirmConfig.message}
        </p>
      </Modal>
    </div>
  );
};

export default Users;