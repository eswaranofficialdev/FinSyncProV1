import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './statCard.css';

const AnimatedNumber = ({ value, prefix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const start = display;
    const end = Number(value) || 0;
    const duration = 900;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{prefix}{display.toLocaleString(undefined, { maximumFractionDigits: decimals })}</span>;
};

const StatCard = ({ title, value, prefix = '₹', icon, gradient = 'primary', delay = 0, subtitle }) => {
  return (
    <motion.div
      className={`stat-card glass-card grad-${gradient}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-title">{title}</span>
        <span className="stat-value"><AnimatedNumber value={value} prefix={prefix} /></span>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </motion.div>
  );
};

export default StatCard;
