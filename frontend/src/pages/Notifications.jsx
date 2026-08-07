import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { FaBell, FaCheckDouble } from 'react-icons/fa';
import api from '../services/api';
import './notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Notifications</h1>
          <p className="page-subtitle">Stay updated on account and community activity</p>
        </div>
        <button className="btn btn-outline" onClick={markAllRead}><FaCheckDouble /> Mark all as read</button>
      </div>

      <div className="glass-card notif-list">
        {loading ? (
          <p style={{ padding: 20 }}>Loading...</p>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <FaBell size={32} style={{ color: 'var(--color-primary)', marginBottom: 10 }} />
            <p style={{ color: 'var(--text-secondary)' }}>You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.div
                key={n._id}
                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !n.isRead && markRead(n._id)}
              >
                <div className="notif-dot-indicator" />
                <div>
                  <p className="notif-title">{n.title}</p>
                  <p className="notif-message">{n.message}</p>
                  <span className="notif-time">{dayjs(n.createdAt).fromNow?.() || dayjs(n.createdAt).format('DD MMM YYYY, hh:mm A')}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Notifications;
