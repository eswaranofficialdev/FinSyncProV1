import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import {
    FaPlus, FaTrash, FaCalendarAlt, FaChartPie,
    FaExclamationTriangle, FaLightbulb, FaListAlt
} from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import './listPage.css';

const CATEGORIES = ['Shopping', 'Bills', 'Travel', 'Health', 'Education', 'Investment', 'Loan', 'Savings', 'Food', 'Rent', 'Entertainment', 'Others'];

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
    const [periodFilter, setPeriodFilter] = useState('monthly');

    // Modals state
    const [modalOpen, setModalOpen] = useState(false);
    const [recommendOpen, setRecommendOpen] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Confirmation hook setup
    const { confirm, ConfirmationModal } = useConfirm();

    const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: 'onChange' });

    const fetchBudgets = useCallback(async () => {
        setLoading(true);
        try {
            const queryParam = periodFilter === 'yearly' ? selectedMonth.substring(0, 4) : selectedMonth;
            const { data } = await api.get(`/budgets?month=${queryParam}&periodType=${periodFilter}`);
            setBudgets(data.data || []);
        } catch {
            toast.error('Failed to load budgets');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, periodFilter]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const fetchRecommendations = async () => {
        try {
            const { data } = await api.get('/budgets/recommendations');
            setRecommendations(data.data || []);
            setRecommendOpen(true);
        } catch {
            toast.error('Failed to generate smart recommendations');
        }
    };

    const onSaveBudget = async (formData) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const formattedMonth = periodFilter === 'yearly' ? selectedMonth.substring(0, 4) : selectedMonth;
            await api.post('/budgets', {
                ...formData,
                amount: Number(formData.amount),
                periodType: periodFilter,
                month: formattedMonth
            });
            toast.success('Budget saved successfully');
            setModalOpen(false);
            reset();
            fetchBudgets();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save budget');
        } finally {
            setSubmitting(false);
        }
    };

    const onDeleteBudget = (id) => {
        confirm(
            'Are you sure you want to delete this budget target? This action cannot be undone.',
            async () => {
                try {
                    await api.delete(`/budgets/${id}`);
                    toast.success('Budget deleted');
                    fetchBudgets();
                } catch {
                    toast.error('Failed to delete budget');
                }
            },
            'Confirm Deletion'
        );
    };

    return (
        <div>
            {/* Header Row */}
            <div className="page-title-row">
                <div>
                    <h1>Smart Budget Planner</h1>
                    <p className="page-subtitle">Track category limits, filter budget types, and view smart recommendations</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <motion.button
                        className="btn btn-outline"
                        onClick={fetchRecommendations}
                        whileTap={{ scale: 0.96 }}
                        style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}
                    >
                        <FaLightbulb /> AI Recommendations
                    </motion.button>
                    <motion.button
                        className="btn btn-primary"
                        onClick={() => { reset({ category: 'Shopping', amount: '' }); setModalOpen(true); }}
                        whileTap={{ scale: 0.96 }}
                    >
                        <FaPlus /> Set Budget
                    </motion.button>
                </div>
            </div>

            {/* Filter Bar: Period Type & Month/Year Selector */}
            <div className="glass-card filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 8 }}>
                    {['monthly', 'weekly', 'yearly'].map((type) => (
                        <button
                            key={type}
                            className={`btn ${periodFilter === type ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '6px 14px', fontSize: '0.82rem', textTransform: 'capitalize' }}
                            onClick={() => setPeriodFilter(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(58, 58, 73, 0.1)', padding: '6px 12px', borderRadius: 8 }}>
                    <FaCalendarAlt size={14} color="var(--color-primary)" />
                    <input
                        type={periodFilter === 'yearly' ? 'number' : 'month'}
                        value={periodFilter === 'yearly' ? selectedMonth.substring(0, 4) : selectedMonth}
                        placeholder={periodFilter === 'yearly' ? 'YYYY' : ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                setSelectedMonth(periodFilter === 'yearly' ? `${e.target.value}-01` : e.target.value);
                            }
                        }}
                        style={{ border: 'none', background: 'transparent', color: 'inherit', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', width: periodFilter === 'yearly' ? 70 : 'auto' }}
                    />
                </div>
            </div>

            {/* Quick Budget Summary List Container */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FaListAlt color="var(--color-primary)" /> Quick Budget Summary ({periodFilter.toUpperCase()})
                </h3>
                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading list...</p>
                ) : budgets.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No active budgets configured for this view.</p>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {budgets.map((b) => (
                            <div
                                key={`pill-${b._id}`}
                                style={{
                                    background: 'rgba(79, 70, 229, 0.08)',
                                    border: '1px solid rgba(79, 70, 229, 0.2)',
                                    padding: '8px 14px',
                                    borderRadius: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: '0.9rem',
                                    fontWeight: 600
                                }}
                            >
                                <span style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{b.category}</span>
                                <span style={{ color: 'var(--color-primary)' }}>₹{b.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detailed Progress Grid Cards */}
            <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 20 }}><FaChartPie style={{ marginRight: 8 }} /> Detailed Progress Overview</h3>

                {loading ? (
                    <p style={{ textAlign: 'center', padding: 20 }}>Loading metrics...</p>
                ) : budgets.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 30 }}>No budgets found. Add targets to monitor your spending health.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {budgets.map((b) => {
                            const isOver = b.spent > b.amount;
                            return (
                                <div key={b._id} className="glass-card" style={{ padding: 20, border: isOver ? '1px solid var(--color-danger)' : '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <span className="badge badge-info">{b.category}</span>
                                        <button className="icon-btn" onClick={() => onDeleteBudget(b._id)} title="Delete Budget">
                                            <FaTrash size={12} />
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                                        <span>Spent: <strong>₹{b.spent.toLocaleString()}</strong></span>
                                        <span>Limit: <strong>₹{b.amount.toLocaleString()}</strong></span>
                                    </div>

                                    <div style={{ width: '100%', height: 10, background: 'rgba(0,0,0,0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                                        <div
                                            style={{
                                                width: `${Math.min(100, b.percentage)}%`,
                                                height: '100%',
                                                background: isOver ? 'var(--color-danger)' : b.percentage > 80 ? 'var(--color-warning)' : 'var(--color-success)',
                                                transition: 'width 0.4s ease'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                        <span style={{ color: isOver ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: isOver ? 'bold' : 'normal' }}>
                                            {isOver ? <><FaExclamationTriangle /> Exceeded by ₹{(b.spent - b.amount).toLocaleString()}</> : `${b.percentage}% utilized`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Set/Edit Budget Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={`Set ${periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1)} Budget`}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit(onSaveBudget)} disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Budget'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit(onSaveBudget)}>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-input" {...register('category', { required: 'Category is required' })}>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Budget Limit Amount (₹)</label>
                        <input
                            className="form-input"
                            type="number"
                            step="1"
                            placeholder="e.g. 5000"
                            {...register('amount', {
                                required: 'Amount is required',
                                min: { value: 1, message: 'Must be greater than 0' },
                                // Added max length validation for 12 digits
                                max: {
                                    value: 999999999999,
                                    message: 'Amount cannot exceed 12 digits'
                                }
                            })}
                        />
                        {errors.amount && <span className="form-error">{errors.amount.message}</span>}
                    </div>
                </form>
            </Modal>

            {/* AI Smart Recommendations Read-Only Modal */}
            <Modal
                isOpen={recommendOpen}
                onClose={() => setRecommendOpen(false)}
                title="AI Smart Budget Recommendations"
            >
                <p className="page-subtitle" style={{ marginBottom: 16 }}>
                    Based on your transaction history, here are optimal budget caps to help keep your spending on track:
                </p>

                {recommendations.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
                        Not enough transaction history found. Add more expenses first!
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {recommendations.map((rec, index) => (
                            <div key={index} className="search-result-item" style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                                <p className="notif-title" style={{ fontWeight: 'bold' }}>{rec.category}</p>
                                <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>{rec.rationale}</p>
                                <p style={{ fontSize: '0.95rem', color: 'var(--color-primary)', fontWeight: 'bold', marginTop: 8 }}>
                                    Recommended Limit: ₹{rec.suggestedAmount.toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Confirmation Modal Hook */}
            <ConfirmationModal />
        </div>
    );
};

export default Budgets;