import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';
import './dashboardLayout.css';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        setUnreadCount(data.meta?.unreadCount || 0);
      } catch {
        // silent fail, non-critical
      }
    };
    fetchUnread();
  }, []);

  return (
    <div className="dashboard-shell">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <div
        className="dashboard-main"
        style={{ marginLeft: collapsed ? 'calc(var(--sidebar-collapsed-width) + 32px)' : 'calc(var(--sidebar-width) + 32px)' }}
      >
        <Navbar
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onToggleMobile={() => setMobileOpen((o) => !o)}
          unreadCount={unreadCount}
        />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
