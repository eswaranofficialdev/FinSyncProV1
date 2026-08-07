import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaSave } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './settings.css';

const TABS = ['Profile', 'Security', 'Preferences'];

const Settings = () => {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Profile');
  const [saving, setSaving] = useState(false);

  const profileForm = useForm({ defaultValues: { name: user?.name, phone: user?.phone, bio: user?.bio, location: user?.location, profession: user?.profession } });
  const prefsForm = useForm({ defaultValues: { currency: user?.currency, timezone: user?.timezone, language: user?.language } });
  const passwordForm = useForm();

  const saveProfile = async (formData) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/users/${user._id}`, formData);
      setUser(data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const savePrefs = async (formData) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/users/${user._id}`, formData);
      setUser(data.data);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (formData) => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.info('Password change requires the Forgot Password flow in this build. Use "Forgot Password" from the login page.');
  };

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      <div className="settings-tabs">
        {TABS.map((tab) => (
          <button key={tab} className={`settings-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 28, marginTop: 16, maxWidth: 560 }}>
        {activeTab === 'Profile' && (
          <form onSubmit={profileForm.handleSubmit(saveProfile)}>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" {...profileForm.register('name')} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" {...profileForm.register('phone')} /></div>
            <div className="form-group"><label className="form-label">Location</label><input className="form-input" {...profileForm.register('location')} /></div>
            <div className="form-group"><label className="form-label">Profession</label><input className="form-input" {...profileForm.register('profession')} /></div>
            <div className="form-group"><label className="form-label">Bio</label><textarea className="form-input" rows="3" {...profileForm.register('bio')} /></div>
            <button className="btn btn-primary" disabled={saving}><FaSave /> Save Profile</button>
          </form>
        )}

        {activeTab === 'Security' && (
          <form onSubmit={passwordForm.handleSubmit(changePassword)}>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" {...passwordForm.register('newPassword', { required: true })} /></div>
            <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" {...passwordForm.register('confirmPassword', { required: true })} /></div>
            <button className="btn btn-primary"><FaSave /> Update Password</button>
          </form>
        )}

        {activeTab === 'Preferences' && (
          <form onSubmit={prefsForm.handleSubmit(savePrefs)}>
            <div className="form-group">
              <label className="form-label">Theme</label>
              <select className="form-input" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-input" {...prefsForm.register('currency')}>
                {['USD', 'EUR', 'GBP', 'INR', 'JPY'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <input className="form-input" {...prefsForm.register('timezone')} placeholder="e.g. Asia/Kolkata" />
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-input" {...prefsForm.register('language')}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <button className="btn btn-primary" disabled={saving}><FaSave /> Save Preferences</button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Settings;
