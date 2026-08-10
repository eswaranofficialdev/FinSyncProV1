import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
import { FaFileDownload } from 'react-icons/fa';
import dayjs from 'dayjs';
import api from '../services/api';
import './listPage.css';

const Reports = () => {
  const [groupBy, setGroupBy] = useState('month');
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/reports', { params: { groupBy } });
      setReport(data.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [groupBy]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const labelFor = (r) => {
    if (groupBy === 'category') return r._id.category || 'Others';
    if (groupBy === 'year') return `${r._id.year}`;
    if (groupBy === 'day') return dayjs(`${r._id.year}-${r._id.month}-${r._id.day}`).format('DD MMM');
    return dayjs(`${r._id.year}-${r._id.month}-01`).format('MMM YYYY');
  };

  const chartData = {
    labels: report.map(labelFor),
    datasets: [
      { label: 'Income', data: report.map((r) => r.totalIncome), backgroundColor: '#22C55E' },
      { label: 'Expense', data: report.map((r) => r.totalExpense), backgroundColor: '#EF4444' },
    ],
  };

  const exportCSV = () => {
    const rows = [['Period', 'Income', 'Expense', 'Count']];
    report.forEach((r) => rows.push([labelFor(r), r.totalIncome, r.totalExpense, r.count]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finsync-report-${groupBy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Reports</h1>
          <p className="page-subtitle">Analyze your income and expense trends</p>
        </div>
        <motion.button className="btn btn-primary" onClick={exportCSV} whileTap={{ scale: 0.96 }}>
          <FaFileDownload /> Export CSV
        </motion.button>
      </div>

      <div className="glass-card filter-bar">
        <select className="form-input" style={{ maxWidth: 200 }} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
          <option value="category">By Category</option>
        </select>
      </div>

      <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 24, marginTop: 16 }}>
        {loading ? (
          <p>Loading report...</p>
        ) : report.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No data for this period</p>
        ) : (
          <div style={{ height: 340 }}>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        )}
      </motion.div>

      <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20, marginTop: 20 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Period</th><th>Income</th><th>Expense</th><th>Net</th><th>Transactions</th></tr></thead>
            <tbody>
              {report.map((r, i) => (
                <tr key={i}>
                  <td data-label="Period">{labelFor(r)}</td>
                  <td data-label="Income">₹{r.totalIncome.toLocaleString()}</td>
                  <td data-label="Expense">₹{r.totalExpense.toLocaleString()}</td>
                  <td data-label="Net">₹{(r.totalIncome - r.totalExpense).toLocaleString()}</td>
                  <td data-label="Transactions">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
