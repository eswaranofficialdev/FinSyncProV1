import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaBriefcase, FaCalendarCheck } from 'react-icons/fa';
import dayjs from 'dayjs';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/users/${user._id}`);
        setStats(data.data.stats);
      } catch {
        // silent
      }
    };
    if (user?._id) fetchStats();
  }, [user]);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Profile</h1>
          <p className="page-subtitle">Your account overview</p>
        </div>
      </div>

      <motion.div className="glass-card profile-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-avatar-big">{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <h2>{user?.name}</h2>
          <span className="badge badge-info">{user?.role}</span>
          <p className="page-subtitle" style={{ marginTop: 8 }}>{user?.bio || 'No bio added yet.'}</p>
        </div>
      </motion.div>

      <div className="profile-grid">
        <motion.div className="glass-card profile-info-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3>Contact Info</h3>
          <ul>
            <li><FaEnvelope /> {user?.email}</li>
            <li><FaPhone /> {user?.phone || 'Not set'}</li>
            <li><FaMapMarkerAlt /> {user?.location || 'Not set'}</li>
            <li><FaBriefcase /> {user?.profession || 'Not set'}</li>
            <li><FaCalendarCheck /> Last login: {user?.lastLogin ? dayjs(user.lastLogin).format('DD MMM YYYY, hh:mm A') : 'Never'}</li>
          </ul>
        </motion.div>

        <motion.div className="glass-card profile-info-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3>Statistics</h3>
          {stats ? (
            <ul>
              <li>Total Income: <strong>₹{stats.totalIncome.toLocaleString()}</strong></li>
              <li>Total Expense: <strong>₹{stats.totalExpense.toLocaleString()}</strong></li>
              <li>Communities Joined: <strong>{stats.communityCount}</strong></li>
            </ul>
          ) : (
            <p className="page-subtitle">Loading stats...</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
