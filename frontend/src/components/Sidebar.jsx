import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaChartPie, FaExchangeAlt, FaUsers, FaFileAlt, FaUserFriends,
  FaBell, FaCog, FaUserCircle, FaSignOutAlt, FaWallet,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './sidebar.css';

const menuItems = [
  { label: 'Dashboard', icon: <FaChartPie />, path: '/dashboard', roles: ['superadmin', 'admin', 'user'] },
  { label: 'Transactions', icon: <FaExchangeAlt />, path: '/transactions', roles: ['superadmin', 'admin', 'user'] },
  { label: 'Community', icon: <FaUserFriends />, path: '/community', roles: ['superadmin', 'admin', 'user'] },
  { label: 'Budget', icon: <FaChartPie />, path: '/budgets', roles: ['superadmin', 'admin', 'user'] },
  { label: 'Reports', icon: <FaFileAlt />, path: '/reports', roles: ['superadmin', 'admin', 'user'] },
  { label: 'Users', icon: <FaUsers />, path: '/users', roles: ['superadmin'] },
  { label: 'Notifications', icon: <FaBell />, path: '/notifications', roles: ['superadmin', 'admin', 'user'] },
  { label: 'Settings', icon: <FaCog />, path: '/settings', roles: ['superadmin', 'admin', 'user'] },
  { label: 'Profile', icon: <FaUserCircle />, path: '/profile', roles: ['superadmin', 'admin', 'user'] },
];

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();

  return (
    <motion.aside
      className={`sidebar glass-card ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      initial={false}
      animate={{ width: collapsed ? 84 : 260 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
    >
      <div className="sidebar-brand">
        <div className="brand-icon"><FaWallet /></div>
        {!collapsed && <span className="brand-text">FinSync Pro</span>}
      </div>

      <nav className="sidebar-nav">
        {menuItems
          .filter((item) => item.roles.includes(user?.role))
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
      </nav>

      <button className="sidebar-logout" onClick={logout}>
        <FaSignOutAlt />
        {!collapsed && <span>Logout</span>}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
