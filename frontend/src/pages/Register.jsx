import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './auth.css';

const getStrength = (password = '') => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0-4
};

const Register = () => {
  const { register: registerField, handleSubmit, watch, formState: { errors } } = useForm();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const password = watch('password', '');
  const strength = useMemo(() => getStrength(password), [password]);
  const strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  const onSubmit = async (formData) => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({ name: formData.name, email: formData.email, password: formData.password });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob blob-1" />
      <div className="auth-blob blob-2" />

      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-brand">
          <div className="brand-icon"><FaWallet /></div>
          <span>FinSync Pro</span>
        </div>
        <h2>Create your account</h2>
        <p className="auth-subtitle">Track your finances and join or create shared communities</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrap">
              <FaUser className="input-icon" />
              <input className="form-input" placeholder="Jane Doe" {...registerField('name', { required: 'Name is required' })} />
            </div>
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrap">
              <FaEnvelope className="input-icon" />
              <input className="form-input" type="email" placeholder="you@example.com" {...registerField('email', { required: 'Email is required' })} />
            </div>
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <FaLock className="input-icon" />
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                {...registerField('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
              />
            </div>
            {password && (
              <>
                <div className="password-strength">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`strength-bar ${
                        i < strength ? (strength <= 1 ? 'active-weak' : strength === 2 ? 'active-medium' : 'active-strong') : ''
                      }`}
                    />
                  ))}
                </div>
                <span className="form-error" style={{ color: 'var(--text-secondary)' }}>{strengthLabel}</span>
              </>
            )}
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-icon-wrap">
              <FaLock className="input-icon" />
              <input className="form-input" type="password" placeholder="••••••••" {...registerField('confirmPassword', { required: 'Please confirm your password' })} />
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
          </div>

          <label className="checkbox-label" style={{ marginBottom: 20 }}>
            <input type="checkbox" {...registerField('terms', { required: true })} /> I agree to the Terms & Conditions
          </label>
          {errors.terms && <span className="form-error">You must accept the terms</span>}

          <motion.button className="btn btn-primary auth-submit" type="submit" disabled={loading} whileTap={{ scale: 0.97 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </motion.button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
