import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaWallet,
  FaPiggyBank, FaUsers, FaArrowUp, FaArrowDown,
} from 'react-icons/fa';
import dayjs from 'dayjs';
import api from '../services/api';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import './dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="page-loader">Loading dashboard...</div>;
  if (!data) return null;

  const { cards, topCategories, trend, recentTransactions } = data;

  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-title-row">
        <div>
          <h1>Welcome back 👋</h1>
          <p className="page-subtitle">Here's your financial overview for {dayjs().format('MMMM YYYY')}</p>
        </div>
      </motion.div>

      <div className="stat-grid">
        <StatCard title="Today's Expense" value={cards.todayExpense} icon={<FaCalendarDay />} gradient="danger" delay={0} />
        <StatCard title="Weekly Expense" value={cards.weekExpense} icon={<FaCalendarWeek />} gradient="warning" delay={0.05} />
        <StatCard title="Monthly Expense" value={cards.monthExpense} icon={<FaCalendarAlt />} gradient="primary" delay={0.1} />
        <StatCard title="Yearly Expense" value={cards.yearExpense} icon={<FaCalendarAlt />} gradient="primary" delay={0.15} />
        <StatCard title="Community Expense" value={cards.communityExpense} icon={<FaUsers />} gradient="warning" delay={0.2} />
        <StatCard title="Remaining Balance" value={cards.balance} icon={<FaWallet />} gradient="success" delay={0.25} />
        <StatCard title="Savings" value={cards.savings} icon={<FaPiggyBank />} gradient="success" delay={0.3} />
        <StatCard title="Expense Ratio" value={cards.expenseRatio} prefix="" icon={<FaArrowUp />} gradient="danger" delay={0.35} subtitle="% of income spent" />
      </div>

      <div className="dashboard-grid">
        <ChartCard title="Income vs Expense Trend" type="line" trend={trend} />
        <ChartCard title="Top Categories" type="doughnut" categories={topCategories} />
      </div>

      <motion.div className="glass-card recent-txn-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3>Recent Transactions</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentTransactions.map((t) => (
                <tr key={t._id}>
                  <td data-label="Description">{t.description || t.transactionNumber}</td>
                  <td data-label="Category">{t.category}</td>
                  <td data-label="Type">
                    <span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                      {t.type === 'income' ? <FaArrowUp /> : <FaArrowDown />} {t.type}
                    </span>
                  </td>
                  <td data-label="Amount">${t.amount.toLocaleString()}</td>
                  <td data-label="Date">{dayjs(t.date).format('DD MMM YYYY')}</td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
