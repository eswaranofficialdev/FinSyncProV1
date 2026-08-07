import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
    <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '4rem', fontWeight: 800 }}>404</motion.h1>
    <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
    <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
  </div>
);

export default NotFound;
