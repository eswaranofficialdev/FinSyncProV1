import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import './chartCard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const monthLabel = (year, month) => dayjs(`${year}-${month}-01`).format('MMM');

const buildTrendData = (trend = []) => {
  const map = {};
  trend.forEach((t) => {
    const key = `${t._id.year}-${t._id.month}`;
    if (!map[key]) map[key] = { label: monthLabel(t._id.year, t._id.month), income: 0, expense: 0 };
    if (t._id.type === 'income') map[key].income = t.total;
    if (t._id.type === 'expense') map[key].expense = t.total;
  });
  const entries = Object.values(map);
  return {
    labels: entries.map((e) => e.label),
    datasets: [
      {
        label: 'Income',
        data: entries.map((e) => e.income),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34,197,94,0.15)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Expense',
        data: entries.map((e) => e.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239,68,68,0.15)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
};

const buildCategoryData = (categories = []) => ({
  labels: categories.map((c) => c._id || 'Others'),
  datasets: [
    {
      data: categories.map((c) => c.total),
      backgroundColor: ['#4F46E5', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'],
      borderWidth: 0,
    },
  ],
});

const ChartCard = ({ title, type, trend, categories, delay = 0.15 }) => {
  const chartData = type === 'line' ? buildTrendData(trend) : buildCategoryData(categories);
  const isEmpty = chartData.labels.length === 0;

  return (
    <motion.div
      className="glass-card chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <h3>{title}</h3>
      <div className="chart-wrap">
        {isEmpty ? (
          <div className="chart-empty">No data yet</div>
        ) : type === 'line' ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        ) : (
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
              cutout: '65%',
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default ChartCard;
