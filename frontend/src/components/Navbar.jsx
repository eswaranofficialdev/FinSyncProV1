import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaSearch, FaMoon, FaSun, FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api'; // Ensure api is imported to fetch previews
import './navbar.css';

const Navbar = ({ onToggleSidebar, onToggleMobile, unreadCount = 0 }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // --- Notification Dropdown State ---
  const [showNotifs, setShowNotifs] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);

  const runSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/transactions?search=${encodeURIComponent(query.trim())}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch recent notifications when the dropdown is opened
  useEffect(() => {
    if (showNotifs) {
      const fetchPreview = async () => {
        setLoadingNotifs(true);
        try {
          const { data } = await api.get('/notifications');
          // Only show the 5 most recent in the navbar popup
          setRecentNotifs(data.data.slice(0, 5));
        } catch (error) {
          console.error('Failed to load notifications');
        } finally {
          setLoadingNotifs(false);
        }
      };
      fetchPreview();
    }
  }, [showNotifs]);

  return (
    <header className="navbar glass-card">
      <div className="navbar-left">
        <button className="icon-btn" onClick={onToggleSidebar}><FaBars /></button>
        <button className="icon-btn mobile-only" onClick={onToggleMobile}><FaBars /></button>

        <form className="navbar-search" onSubmit={runSearch}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search transactions by description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="navbar-right">
        <button className="icon-btn" onClick={toggleTheme}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* --- Notification Bell & Dropdown --- */}
        <div className="notif-wrapper" ref={notifRef}>
          <button className="icon-btn notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
            <FaBell />
            {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                className="notif-dropdown glass-card"
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="notif-dropdown-header">
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className="badge badge-warning">{unreadCount} New</span>}
                </div>

                <div className="notif-dropdown-body">
                  {loadingNotifs ? (
                    <div className="notif-empty">Loading...</div>
                  ) : recentNotifs.length === 0 ? (
                    <div className="notif-empty">No new notifications</div>
                  ) : (
                    recentNotifs.map((n) => (
                      <div 
                        key={n._id} 
                        className={`notif-dropdown-item ${!n.isRead ? 'unread' : ''}`}
                        onClick={() => {
                          setShowNotifs(false);
                          navigate('/notifications');
                        }}
                      >
                        <p className="notif-title">{n.title}</p>
                        <p className="notif-message">{n.message}</p>
                        <span className="notif-time">
                          {dayjs(n.createdAt).fromNow?.() || dayjs(n.createdAt).format('DD MMM, hh:mm A')}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div 
                  className="notif-dropdown-footer" 
                  onClick={() => {
                    setShowNotifs(false);
                    navigate('/notifications');
                  }}
                >
                  View All Notifications
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* ---------------------------------- */}

        <div className="navbar-profile">
          <div className="avatar-circle">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="profile-meta">
            <span className="profile-name">{user?.name}</span>
            <span className="profile-role badge badge-info">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;