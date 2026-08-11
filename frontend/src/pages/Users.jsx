import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { FaBan, FaCheckCircle, FaTrash, FaSearch } from 'react-icons/fa';
import api from '../services/api';
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
    const newStatus = u.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.patch(`/users/${u._id}/status`, { status: newStatus });
      toast.success(`User ${newStatus}`);
      fetchUsers();
    } catch {
      toast.error('Action failed');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Delete failed');
    }
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
          <input placeholder="Search name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                    <button className="icon-btn" title={u.status === 'suspended' ? 'Activate' : 'Suspend'} onClick={() => toggleStatus(u)}>
                      {u.status === 'suspended' ? <FaCheckCircle /> : <FaBan />}
                    </button>
                    <button className="icon-btn" title="Delete" onClick={() => deleteUser(u)}><FaTrash /></button>
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
    </div>
  );
};

export default Users;
