import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaSearch, FaMoon, FaSun, FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './navbar.css';

const Navbar = ({ onToggleSidebar, onToggleMobile, unreadCount = 0 }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const runSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/transactions?search=${encodeURIComponent(query.trim())}`);
  };

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

        <button className="icon-btn notif-btn">
          <FaBell />
          {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
        </button>

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