import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaLock, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';
import './auth.css';

export const ForgotPassword = () => {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', formData);
      setSent(true);
      toast.success('If that email exists, a reset link has been sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob blob-1" />
      <div className="auth-blob blob-2" />
      <motion.div className="auth-card glass-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-brand"><div className="brand-icon"><FaWallet /></div><span>FinSync Pro</span></div>
        <h2>Forgot Password</h2>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

        {sent ? (
          <p>Check your inbox for further instructions.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-icon-wrap">
                <FaEnvelope className="input-icon" />
                <input className="form-input" type="email" placeholder="you@example.com" {...register('email', { required: true })} />
              </div>
            </div>
            <motion.button className="btn btn-primary auth-submit" type="submit" disabled={loading} whileTap={{ scale: 0.97 }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          </form>
        )}

        <p className="auth-footer-text"><Link to="/login" className="auth-link">Back to Sign In</Link></p>
      </motion.div>
    </div>
  );
};

export const ResetPassword = () => {
  const { register, handleSubmit } = useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: searchParams.get('token'),
        password: formData.password,
      });
      toast.success('Password reset successful. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob blob-1" />
      <div className="auth-blob blob-2" />
      <motion.div className="auth-card glass-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-brand"><div className="brand-icon"><FaWallet /></div><span>FinSync Pro</span></div>
        <h2>Reset Password</h2>
        <p className="auth-subtitle">Enter your new password below.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="input-icon-wrap">
              <FaLock className="input-icon" />
              <input className="form-input" type="password" placeholder="••••••••" {...register('password', { required: true, minLength: 6 })} />
            </div>
          </div>
          <motion.button className="btn btn-primary auth-submit" type="submit" disabled={loading} whileTap={{ scale: 0.97 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
