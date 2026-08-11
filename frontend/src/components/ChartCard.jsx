import { Line, Doughnut, Bar, Pie, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import './chartCard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler
);

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const getMonthName = (monthNum) => monthLabels[monthNum - 1] || dayjs().month(monthNum - 1).format('MMM');

// --- BUILD TREND DATA ---
const buildTrendData = (trend = []) => {
  const map = {};

  if (Array.isArray(trend)) {
    trend.forEach((t) => {
      if (t && t._id) {
        const year = t._id.year;
        const month = t._id.month;
        const type = t._id.type;

        if (year && month) {
          const key = `${year}-${month}`;
          if (!map[key]) {
            map[key] = {
              label: `${getMonthName(month)} ${year}`,
              income: 0,
              expense: 0,
            };
          }
          if (type === 'income') map[key].income = t.total || 0;
          if (type === 'expense') map[key].expense = t.total || 0;
        }
      }
    });
  }

  const entries = Object.values(map);

  return {
    labels: entries.map((e) => e.label),
    datasets: [
      {
        label: 'Income',
        data: entries.map((e) => e.income),
        borderColor: '#10B981',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Expense',
        data: entries.map((e) => e.expense),
        borderColor: '#F43F5E',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
          gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#F43F5E',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
};

// --- BUILD CATEGORY DATA ---
const buildCategoryData = (categories = []) => ({
  labels: Array.isArray(categories) ? categories.map((c) => (c && c._id ? c._id : 'Others')) : [],
  datasets: [
    {
      data: Array.isArray(categories) ? categories.map((c) => (c ? c.total : 0)) : [],
      backgroundColor: ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#14B8A6'],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 8,
    },
  ],
});

// --- BUILD BAR DATA ---
const buildBarData = (data = []) => {
  const map = {};

  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (item && item._id) {
        const key = item._id;
        map[key] = (map[key] || 0) + (item.total || 0);
      }
    });
  }

  const entries = Object.entries(map);

  return {
    labels: entries.map(([key]) => key),
    datasets: [
      {
        label: 'Amount',
        data: entries.map(([, value]) => value),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(244, 63, 94, 0.8)',
        ],
        borderColor: ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'],
        borderWidth: 2,
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };
};

// --- BUILD RADAR DATA ---
const buildRadarData = (data = []) => ({
  labels: ['Speed', 'Accuracy', 'Consistency', 'Learning', 'Productivity', 'Focus'],
  datasets: [
    {
      label: 'Performance',
      data: data.length > 0 ? data : [65, 70, 60, 75, 80, 68],
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: '#6366F1',
      borderWidth: 3,
      pointBackgroundColor: '#6366F1',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ],
});

// ============================================
// 1. MAIN CHART CARD (Original)
// ============================================
export const ChartCard = ({
  title,
  type = 'line',
  trend,
  categories,
  data,
  delay = 0.15,
  height = 250,
  showLegend = true,
  showGrid = true,
}) => {
  let chartData;
  let chartType;

  switch (type) {
    case 'line':
      chartData = buildTrendData(trend);
      chartType = 'line';
      break;
    case 'doughnut':
      chartData = buildCategoryData(categories);
      chartType = 'doughnut';
      break;
    case 'bar':
      chartData = buildBarData(data);
      chartType = 'bar';
      break;
    case 'radar':
      chartData = buildRadarData(data);
      chartType = 'radar';
      break;
    default:
      chartData = buildTrendData(trend);
      chartType = 'line';
  }

  const isEmpty = !chartData || chartData.labels?.length === 0;

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: { size: 12, weight: '500' },
            color: 'var(--text-secondary, #64748b)',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
          boxPadding: 6,
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
        },
      },
    };

    if (type === 'line') {
      return {
        ...baseOptions,
        scales: {
          x: { grid: { display: showGrid }, ticks: { font: { size: 11 }, color: 'var(--text-secondary, #64748b)' } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.3)', borderDash: [4, 4], display: showGrid },
            ticks: { font: { size: 11 }, color: 'var(--text-secondary, #64748b)' },
          },
        },
        interaction: { intersect: false, mode: 'index' },
      };
    }

    if (type === 'doughnut' || type === 'pie') {
      return {
        ...baseOptions,
        cutout: type === 'doughnut' ? '70%' : 0,
        plugins: {
          ...baseOptions.plugins,
          legend: { ...baseOptions.plugins.legend, position: 'bottom', labels: { ...baseOptions.plugins.legend.labels, padding: 15 } },
        },
      };
    }

    if (type === 'bar') {
      return {
        ...baseOptions,
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: 'var(--text-secondary, #64748b)' } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.3)', borderDash: [4, 4], display: showGrid },
            ticks: { font: { size: 11 }, color: 'var(--text-secondary, #64748b)' },
          },
        },
      };
    }

    if (type === 'radar') {
      return {
        ...baseOptions,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(226, 232, 240, 0.3)' },
            ticks: { font: { size: 10 }, color: 'var(--text-secondary, #64748b)' },
            pointLabels: { font: { size: 11, weight: '500' }, color: 'var(--text-primary, #0f172a)' },
          },
        },
      };
    }

    return baseOptions;
  };

  const renderChart = () => {
    if (isEmpty) {
      return (
        <div className="chart-empty">
          <span className="empty-icon">📊</span>
          <p>No data available</p>
          <span className="empty-sub">Start tracking to see your insights</span>
        </div>
      );
    }

    switch (type) {
      case 'line': return <Line data={chartData} options={getChartOptions()} />;
      case 'doughnut': return <Doughnut data={chartData} options={getChartOptions()} />;
      case 'pie': return <Pie data={chartData} options={getChartOptions()} />;
      case 'bar': return <Bar data={chartData} options={getChartOptions()} />;
      case 'radar': return <Radar data={chartData} options={getChartOptions()} />;
      default: return <Line data={chartData} options={getChartOptions()} />;
    }
  };

  const getStats = () => {
    if (isEmpty) return null;

    if (type === 'line' && chartData.datasets) {
      const incomeData = chartData.datasets[0]?.data || [];
      const expenseData = chartData.datasets[1]?.data || [];
      const totalIncome = incomeData.reduce((a, b) => a + b, 0);
      const totalExpense = expenseData.reduce((a, b) => a + b, 0);

      return (
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-dot income"></span>
            <span className="stat-label">Total Income</span>
            <span className="stat-value positive">₹{totalIncome.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-dot expense"></span>
            <span className="stat-label">Total Expense</span>
            <span className="stat-value negative">₹{totalExpense.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-dot"></span>
            <span className="stat-label">Net</span>
            <span className={`stat-value ${totalIncome - totalExpense >= 0 ? 'positive' : 'negative'}`}>
              ₹{(totalIncome - totalExpense).toLocaleString()}
            </span>
          </div>
        </div>
      );
    }

    if (type === 'doughnut' || type === 'pie') {
      const total = chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0;
      return (
        <div className="chart-stats center">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">₹{total.toLocaleString()}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      className="glass-card chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <span className="chart-badge">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
      </div>
      {getStats()}
      <div className="chart-wrap" style={{ height: `${height}px` }}>{renderChart()}</div>
    </motion.div>
  );
};

// ============================================
// 2. MINIMAL CHART CARD
// ============================================
export const MinimalChartCard = ({ title, type = 'line', trend, categories, data, delay = 0.15, height = 200 }) => {
  let chartData;
  switch (type) {
    case 'line': chartData = buildTrendData(trend); break;
    case 'doughnut': chartData = buildCategoryData(categories); break;
    case 'bar': chartData = buildBarData(data); break;
    default: chartData = buildTrendData(trend);
  }

  const isEmpty = !chartData || chartData.labels?.length === 0;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: type === 'line' ? {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 10 } } },
    } : undefined,
    cutout: type === 'doughnut' ? '65%' : undefined,
  };

  return (
    <motion.div
      className="minimal-chart-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="minimal-header">
        <h4>{title}</h4>
        <span className="minimal-stat">{type === 'line' ? '📈' : type === 'doughnut' ? '🎯' : '📊'}</span>
      </div>
      <div className="chart-wrap" style={{ height: `${height}px` }}>
        {isEmpty ? (
          <div className="chart-empty minimal-empty"><span>No data</span></div>
        ) : type === 'line' ? (
          <Line data={chartData} options={options} />
        ) : type === 'doughnut' ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// 3. METRIC CHART CARD
// ============================================
export const MetricChartCard = ({ title, type = 'line', trend, categories, data, delay = 0.15, height = 220 }) => {
  let chartData;
  switch (type) {
    case 'line': chartData = buildTrendData(trend); break;
    case 'doughnut': chartData = buildCategoryData(categories); break;
    case 'bar': chartData = buildBarData(data); break;
    default: chartData = buildTrendData(trend);
  }

  const isEmpty = !chartData || chartData.labels?.length === 0;

  const total = chartData.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 0;
  const avg = chartData.datasets?.[0]?.data?.length > 0
    ? Math.round(total / chartData.datasets[0].data.length)
    : 0;
  const max = Math.max(...(chartData.datasets?.[0]?.data || [0]));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15, font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: type === 'line' ? {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(226, 232, 240, 0.2)' }, ticks: { font: { size: 10 } } },
    } : undefined,
    cutout: type === 'doughnut' ? '70%' : undefined,
  };

  return (
    <motion.div
      className="metric-chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="metric-header">
        <h3>{title}</h3>
        <div className="metric-summary">
          <div className="metric-item">
            <span className="metric-label">Total</span>
            <span className="metric-value">₹{total.toLocaleString()}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Avg</span>
            <span className="metric-value">₹{avg.toLocaleString()}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Max</span>
            <span className="metric-value">₹{max.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: `${height}px` }}>
        {isEmpty ? (
          <div className="chart-empty"><span className="empty-icon">📊</span><p>No data</p></div>
        ) : type === 'line' ? (
          <Line data={chartData} options={options} />
        ) : type === 'doughnut' ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// 4. NEUMORPHIC CHART CARD
// ============================================
export const NeumorphicChartCard = ({ title, type = 'line', trend, categories, data, delay = 0.15, height = 240 }) => {
  let chartData;
  switch (type) {
    case 'line': chartData = buildTrendData(trend); break;
    case 'doughnut': chartData = buildCategoryData(categories); break;
    case 'bar': chartData = buildBarData(data); break;
    default: chartData = buildTrendData(trend);
  }

  const isEmpty = !chartData || chartData.labels?.length === 0;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { size: 12, weight: '500' } },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: type === 'line' ? {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(226, 232, 240, 0.2)' }, ticks: { font: { size: 11 } } },
    } : undefined,
    cutout: type === 'doughnut' ? '68%' : undefined,
  };

  return (
    <motion.div
      className="neumorphic-chart-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      <div className="neumorphic-header">
        <h3>{title}</h3>
        <div className="neumorphic-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: `${height}px` }}>
        {isEmpty ? (
          <div className="chart-empty"><div className="empty-ring"></div><p>Awaiting data...</p></div>
        ) : type === 'line' ? (
          <Line data={chartData} options={options} />
        ) : type === 'doughnut' ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// 5. DARK THEME CHART CARD
// ============================================
export const DarkChartCard = ({ title, type = 'line', trend, categories, data, delay = 0.15, height = 240 }) => {
  let chartData;
  switch (type) {
    case 'line': chartData = buildTrendData(trend); break;
    case 'doughnut': chartData = buildCategoryData(categories); break;
    case 'bar': chartData = buildBarData(data); break;
    default: chartData = buildTrendData(trend);
  }

  const isEmpty = !chartData || chartData.labels?.length === 0;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { size: 12, weight: '500' }, color: '#94a3b8' },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleFont: { size: 13, weight: '600', color: '#f8fafc' },
        bodyFont: { size: 12, color: '#cbd5e1' },
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: type === 'line' ? {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
      y: { beginAtZero: true, grid: { color: 'rgba(71, 85, 105, 0.3)' }, ticks: { font: { size: 11 }, color: '#64748b' } },
    } : undefined,
    cutout: type === 'doughnut' ? '70%' : undefined,
  };

  return (
    <motion.div
      className="dark-chart-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="dark-header">
        <h3>{title}</h3>
        <div className="dark-status">
          <span className="status-indicator"></span>
          <span className="status-text">Live</span>
        </div>
      </div>
      <div className="chart-wrap dark-chart-wrap" style={{ height: `${height}px` }}>
        {isEmpty ? (
          <div className="chart-empty dark-empty"><p>No data available</p></div>
        ) : type === 'line' ? (
          <Line data={chartData} options={options} />
        ) : type === 'doughnut' ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// 6. COMPACT CHART CARD (Small Screens)
// ============================================
export const CompactChartCard = ({ title, type = 'line', trend, categories, data, delay = 0.15, height = 150 }) => {
  let chartData;
  switch (type) {
    case 'line': chartData = buildTrendData(trend); break;
    case 'doughnut': chartData = buildCategoryData(categories); break;
    case 'bar': chartData = buildBarData(data); break;
    default: chartData = buildTrendData(trend);
  }

  const isEmpty = !chartData || chartData.labels?.length === 0;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 11, weight: '600' },
        bodyFont: { size: 10 },
        padding: 8,
        cornerRadius: 6,
      },
    },
    scales: type === 'line' ? {
      x: { grid: { display: false }, ticks: { font: { size: 8 } } },
      y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 8 } } },
    } : undefined,
    cutout: type === 'doughnut' ? '60%' : undefined,
  };

  return (
    <motion.div
      className="compact-chart-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="compact-header">
        <span className="compact-title">{title}</span>
        <span className="compact-icon">{type === 'line' ? '📈' : type === 'doughnut' ? '🎯' : '📊'}</span>
      </div>
      <div className="chart-wrap" style={{ height: `${height}px` }}>
        {isEmpty ? (
          <div className="chart-empty compact-empty">No data</div>
        ) : type === 'line' ? (
          <Line data={chartData} options={options} />
        ) : type === 'doughnut' ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default ChartCard;