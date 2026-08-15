import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  Tooltip, 
  Legend 
} from 'chart.js';
import { toast } from 'react-toastify';
import { FaFileDownload, FaWallet, FaUsers, FaChartPie, FaCalendarAlt } from 'react-icons/fa';
import dayjs from 'dayjs';
import api from '../services/api';
import './listPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Reports = () => {
  const [groupBy, setGroupBy] = useState('month');
  const [dataSource, setDataSource] = useState('personal'); // 'personal' or 'community'
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [communityDetail, setCommunityDetail] = useState(null);
  const [communityTxns, setCommunityTxns] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch communities related to user
  const fetchCommunities = useCallback(async () => {
    try {
      const { data } = await api.get('/communities');
      setCommunities(data.data || []);
      if (data.data && data.data.length > 0) {
        setSelectedCommunityId(data.data[0]._id);
      }
    } catch {
      toast.error('Failed to load communities');
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Fetch specific community details & monthly records when community mode is active
  const fetchCommunityReportData = useCallback(async () => {
    if (!selectedCommunityId) return;
    setLoading(true);
    try {
      const [detailRes, txnRes] = await Promise.all([
        api.get(`/communities/${selectedCommunityId}`),
        api.get(`/communities/${selectedCommunityId}/transactions?month=${selectedMonth}`)
      ]);

      setCommunityDetail(detailRes.data.data);
      setCommunityTxns(txnRes.data.data || []);
    } catch {
      toast.error('Failed to load community report');
    } finally {
      setLoading(false);
    }
  }, [selectedCommunityId, selectedMonth]);

  // Fetch Personal Report Data
  const fetchPersonalReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/reports', { params: { groupBy } });
      setReport(data.data || []);
    } catch {
      toast.error('Failed to load personal report');
    } finally {
      setLoading(false);
    }
  }, [groupBy]);

  useEffect(() => {
    if (dataSource === 'personal') {
      fetchPersonalReport();
    } else {
      fetchCommunityReportData();
    }
  }, [dataSource, fetchPersonalReport, fetchCommunityReportData]);

  // Permissions check for community export
  const selectedCommunity = communities.find((c) => c._id === selectedCommunityId);
  const isCommunityOwner = selectedCommunity?.myRole === 'owner' || communityDetail?.myRole === 'owner';

  const labelFor = (r) => {
    if (groupBy === 'category') return r._id?.category || 'Others';
    if (groupBy === 'year') return `${r._id?.year}`;
    if (groupBy === 'day') return dayjs(`${r._id?.year}-${r._id?.month}-${r._id?.day}`).format('DD MMM');
    return dayjs(`${r._id?.year}-${r._id?.month}-01`).format('MMM YYYY');
  };

  // Personal Metrics Calculation
  const totalIncome = report.reduce((sum, r) => sum + (r.totalIncome || 0), 0);
  const totalExpense = report.reduce((sum, r) => sum + (r.totalExpense || 0), 0);
  const netFlow = totalIncome - totalExpense;

  // Personal Bar Chart Data
  const personalBarData = {
    labels: report.map(labelFor),
    datasets: [
      { label: 'Income', data: report.map((r) => r.totalIncome || 0), backgroundColor: '#22C55E' },
      { label: 'Expense', data: report.map((r) => r.totalExpense || 0), backgroundColor: '#EF4444' },
    ],
  };

  // Personal Category Distribution Doughnut Chart
  const personalDoughnutData = {
    labels: report.map(r => r._id?.category || 'Others'),
    datasets: [{
      data: report.map(r => r.totalExpense || 0),
      backgroundColor: ['#4F46E5', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']
    }]
  };

  // Unique Color Palette for Community Members
  const MEMBER_COLORS = [
    '#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#10B981'
  ];

  // Community Member Shares Calculation for Chart with Unique Colors
  const memberShareData = communityDetail?.members ? {
    labels: communityDetail.members.map(m => m.user?.name || 'Member'),
    datasets: [{
      label: 'Member Share (Owes)',
      data: communityDetail.members.map(m => {
        return communityTxns
          .filter(t => t.splitAmong?.some(u => (u._id || u) === m.user?._id))
          .reduce((sum, t) => sum + (t.amount / (t.splitAmong?.length || 1)), 0);
      }),
      backgroundColor: communityDetail.members.map((_, index) => MEMBER_COLORS[index % MEMBER_COLORS.length])
    }]
  } : { labels: [], datasets: [] };

  // CSV Export handler
  const exportCSV = () => {
    if (dataSource === 'community' && !isCommunityOwner) {
      toast.error('Only the community creator can export community reports.');
      return;
    }

    let rows = [];
    let filename = '';

    if (dataSource === 'personal') {
      rows = [['Period', 'Income', 'Expense', 'Net', 'Count']];
      report.forEach((r) => rows.push([labelFor(r), r.totalIncome || 0, r.totalExpense || 0, (r.totalIncome || 0) - (r.totalExpense || 0), r.count || 0]));
      filename = `finsync-personal-report-${groupBy}.csv`;
    } else {
      rows = [['Member Name', 'Total Spend (Community)', 'Total Owes (Share)', 'Net Expense']];
      communityDetail?.members?.forEach((m) => {
        const spend = communityTxns.filter(t => (t.owner?._id || t.owner) === m.user?._id).reduce((sum, t) => sum + t.amount, 0);
        const owes = communityTxns.filter(t => t.splitAmong?.some(u => (u._id || u) === m.user?._id)).reduce((sum, t) => sum + (t.amount / (t.splitAmong?.length || 1)), 0);
        const expense = owes - spend;
        rows.push([m.user?.name, spend.toFixed(2), owes.toFixed(2), expense.toFixed(2)]);
      });
      filename = `finsync-${selectedCommunity?.name || 'community'}-monthly-report.csv`;
    }

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Financial Reports</h1>
          <p className="page-subtitle">Analyze trends, cash flow, and community breakdowns</p>
        </div>
        {(dataSource === 'personal' || isCommunityOwner) && (
          <motion.button className="btn btn-primary" onClick={exportCSV} whileTap={{ scale: 0.96 }}>
            <FaFileDownload /> Export CSV Report
          </motion.button>
        )}
      </div>

      {/* Unique Class Toggle Bar */}
      <div className="glass-card filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="reports-toggle-container">
          <button
            className={`reports-toggle-btn ${dataSource === 'personal' ? 'active' : ''}`}
            onClick={() => setDataSource('personal')}
          >
            <FaWallet style={{ marginRight: 6 }} /> Personal Stats
          </button>
          <button
            className={`reports-toggle-btn ${dataSource === 'community' ? 'active' : ''}`}
            onClick={() => setDataSource('community')}
          >
            <FaUsers style={{ marginRight: 6 }} /> Community Stats
          </button>
        </div>

        {dataSource === 'community' && (
          <>
            <select 
              className="form-input" 
              style={{ maxWidth: 220 }} 
              value={selectedCommunityId} 
              onChange={(e) => setSelectedCommunityId(e.target.value)}
            >
              {communities.length === 0 ? (
                <option value="">No communities found</option>
              ) : (
                communities.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))
              )}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(58, 58, 73, 0.1)', padding: '4px 8px', borderRadius: 8 }}>
              <FaCalendarAlt size={14} color="var(--color-primary)" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => { if (e.target.value) setSelectedMonth(e.target.value); }}
                style={{ border: 'none', background: 'transparent', color: 'inherit', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
              />
            </div>
          </>
        )}

        {dataSource === 'personal' && (
          <select className="form-input" style={{ maxWidth: 180 }} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="category">By Category</option>
          </select>
        )}
      </div>

      {/* --- PERSONAL VIEW --- */}
      {dataSource === 'personal' && (
        <>
          <div className="stat-grid" style={{ marginTop: 16, marginBottom: 16 }}>
            <div className="glass-card" style={{ padding: 18 }}>
              <p className="page-subtitle">Total Inflow</p>
              <h3 style={{ color: 'var(--color-success)' }}>₹{totalIncome.toLocaleString()}</h3>
            </div>
            <div className="glass-card" style={{ padding: 18 }}>
              <p className="page-subtitle">Total Expense</p>
              <h3 style={{ color: 'var(--color-danger)' }}>₹{totalExpense.toLocaleString()}</h3>
            </div>
            <div className="glass-card" style={{ padding: 18 }}>
              <p className="page-subtitle">Net Cash Flow</p>
              <h3 style={{ color: netFlow >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                ₹{netFlow.toLocaleString()}
              </h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 16 }}>
            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Cash Flow Trend</h3>
              <div style={{ height: 300 }}>
                <Bar data={personalBarData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </motion.div>

            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Expense Distribution by Category</h3>
              <div style={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={personalDoughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </motion.div>
          </div>

          <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20, marginTop: 20 }}>
            <h3 style={{ marginBottom: 14 }}><FaChartPie style={{ marginRight: 6 }} /> Personal Breakdown Records</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Period</th><th>Income</th><th>Expense</th><th>Net Flow</th><th>Entries</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading breakdown...</td></tr>
                  ) : report.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No data found</td></tr>
                  ) : (
                    report.map((r, i) => {
                      const income = r?.totalIncome || 0;
                      const expense = r?.totalExpense || 0;
                      const net = income - expense;
                      return (
                        <tr key={i}>
                          <td data-label="Period">{labelFor(r)}</td>
                          <td data-label="Income">₹{income.toLocaleString()}</td>
                          <td data-label="Expense">₹{expense.toLocaleString()}</td>
                          <td data-label="Net Flow">₹{net.toLocaleString()}</td>
                          <td data-label="Entries">{r?.count || 0}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {/* --- COMMUNITY MONTHLY REPORT VIEW --- */}
      {dataSource === 'community' && communityDetail && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ marginTop: 20 }}>
          <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Member Expenses ({dayjs(selectedMonth).format('MMMM YYYY')})</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Total Spend (Community)</th>
                    <th>Total Owes (Their Share)</th>
                    <th>Total Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading month data...</td></tr>
                  ) : communityDetail.members.map((m) => {
                    const spend = communityTxns
                      .filter(t => (t.owner?._id || t.owner) === m.user?._id)
                      .reduce((sum, t) => sum + t.amount, 0);

                    const owes = communityTxns
                      .filter(t => t.splitAmong?.some(u => (u._id || u) === m.user?._id))
                      .reduce((sum, t) => sum + (t.amount / (t.splitAmong?.length || 1)), 0);

                    const expense = owes - spend;

                    return (
                      <tr key={m._id}>
                        <td data-label="Name">{m.user?.name}</td>
                        <td data-label="Total Spend">₹{spend.toFixed(2)}</td>
                        <td data-label="Total Owes">₹{owes.toFixed(2)}</td>
                        <td data-label="Total Expense" style={{ color: expense > 0 ? 'var(--color-danger)' : expense < 0 ? 'var(--color-success)' : 'inherit', fontWeight: 'bold' }}>
                          {expense > 0 ? `Owes ₹${expense.toFixed(2)}` : expense < 0 ? `Collects ₹${Math.abs(expense).toFixed(2)}` : '₹0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Member Shares Comparison Chart with Distinct Colors */}
          <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Member Share Comparison</h3>
            <div style={{ height: 300 }}>
              <Bar data={memberShareData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Reports;