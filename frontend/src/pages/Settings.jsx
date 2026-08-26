import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import { useForm } from 'react-hook-form';

import { toast } from 'react-toastify';

import {
  FaSave,
  FaSun,
  FaMoon,
  FaCheck,
  FaUndo,
  FaDownload
} from 'react-icons/fa';

import api from '../services/api';

import { useAuth } from '../context/AuthContext';

import { useTheme } from '../context/ThemeContext';

import './settings.css';


const TABS = [
  'Profile',
  'Security',
  'Preferences',
];


const Settings = () => {

  const { user, setUser } = useAuth();

  const {
    theme,
    setTheme,
    colorTheme,
    colorThemes,
    changeColorTheme,
    resetTheme,
  } = useTheme();


  const [activeTab, setActiveTab] =
    useState('Profile');

  const [saving, setSaving] =
    useState(false);


  /* ========================================================
     PWA INSTALLATION STATES (ANDROID & IOS)
     ======================================================== */
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 2. Listen for Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async (e) => {
    e.preventDefault(); // Prevent form submission

    if (isInstallable && deferredPrompt) {
      // Android / Chrome: Show native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS: Show instructions
      toast.info(
        'To install on iPhone/iPad: Tap the Share button at the bottom of your screen and select "Add to Home Screen". (Note: You must use Safari!)',
        { autoClose: 7000 }
      );
    } else {
      // Fallback
      toast.info('App is already installed or your browser does not support installation.');
    }
  };


  /* ========================================================
     PROFILE FORM
     ======================================================== */

  const profileForm = useForm({
    mode: 'onChange',
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      profession: user?.profession || '',
    },
  });


  /* ========================================================
     PREFERENCES FORM
     ======================================================== */

  const prefsForm = useForm({
    defaultValues: {
      currency: user?.currency || 'INR',
      timezone: user?.timezone || 'Asia/Kolkata',
      language: user?.language || 'en',
    },
  });


  /* ========================================================
     PASSWORD FORM
     ======================================================== */

  const passwordForm = useForm({
    mode: 'onChange',
  });


  /* ========================================================
     SAVE PROFILE
     ======================================================== */

  const saveProfile = async (formData) => {

    setSaving(true);

    try {

      const { data } = await api.put(
        `/users/${user._id}`,
        formData
      );

      setUser(data.data);

      toast.success(
        'Profile updated successfully'
      );

    } catch (err) {

      toast.error(
        err.response?.data?.message ||
        'Update failed'
      );

    } finally {

      setSaving(false);

    }
  };


  /* ========================================================
     SAVE PREFERENCES
     ======================================================== */

  const savePrefs = async (formData) => {

    setSaving(true);

    try {

      const { data } = await api.put(
        `/users/${user._id}`,
        formData
      );

      setUser(data.data);

      toast.success(
        'Preferences saved successfully'
      );

    } catch (err) {

      toast.error(
        err.response?.data?.message ||
        'Update failed'
      );

    } finally {

      setSaving(false);

    }
  };


  /* ========================================================
     PASSWORD
     ======================================================== */

  const changePassword = async (formData) => {

    if (
      formData.newPassword !==
      formData.confirmPassword
    ) {

      toast.error(
        'Passwords do not match'
      );

      return;
    }

    toast.info(
      'Password change requires the Forgot Password flow in this build. Use "Forgot Password" from the login page.'
    );
  };


  /* ========================================================
     RESET THEME
     ======================================================== */

  const handleResetTheme = () => {

    resetTheme();

    toast.success(
      'Theme reset to default'
    );
  };


  return (
    <div className="settings-page">

      {/* ==================================================
          PAGE HEADER
          ================================================== */}

      <div className="page-title-row">

        <div>

          <h1>
            Settings
          </h1>

          <p className="page-subtitle">
            Manage your account preferences
          </p>

        </div>

      </div>


      {/* ==================================================
          TABS
          ================================================== */}

      <div className="settings-tabs">

        {TABS.map((tab) => (

          <button
            key={tab}
            type="button"
            className={`settings-tab ${
              activeTab === tab
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(tab)
            }
          >
            {tab}
          </button>

        ))}

      </div>


      {/* ==================================================
          CONTENT
          ================================================== */}

      <motion.div
        className="glass-card settings-card"
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >

        {/* ==================================================
            PROFILE
            ================================================== */}

        {activeTab === 'Profile' && (

          <form
            onSubmit={
              profileForm.handleSubmit(
                saveProfile
              )
            }
          >

            <div className="form-group">

              <label className="form-label">
                Full Name
              </label>

              <input
                className="form-input"
                {...profileForm.register('name', {
                  required: 'Full name is required',
                  minLength: { value: 3, message: 'Minimum 3 characters required' },
                  maxLength: { value: 30, message: 'Maximum 30 characters allowed' }
                })}
              />
              {profileForm.formState.errors.name && (
                <span className="form-error">{profileForm.formState.errors.name.message}</span>
              )}

            </div>


            <div className="form-group">

              <label className="form-label">
                Phone
              </label>

              <input
                className="form-input"
                type="text"
                {...profileForm.register('phone', {
                  minLength: { value: 6, message: 'Minimum 6 digits required' },
                  maxLength: { value: 10, message: 'Maximum 10 digits allowed' },
                  pattern: { value: /^[0-9]*$/, message: 'Only numbers allowed' }
                })}
              />
              {profileForm.formState.errors.phone && (
                <span className="form-error">{profileForm.formState.errors.phone.message}</span>
              )}

            </div>


            <div className="form-group">

              <label className="form-label">
                Location
              </label>

              <input
                className="form-input"
                {...profileForm.register('location', {
                  minLength: { value: 3, message: 'Minimum 3 characters required' },
                  maxLength: { value: 30, message: 'Maximum 30 characters allowed' }
                })}
              />
              {profileForm.formState.errors.location && (
                <span className="form-error">{profileForm.formState.errors.location.message}</span>
              )}

            </div>


            <div className="form-group">

              <label className="form-label">
                Profession
              </label>

              <input
                className="form-input"
                {...profileForm.register('profession', {
                  maxLength: { value: 30, message: 'Maximum 30 characters allowed' }
                })}
              />
              {profileForm.formState.errors.profession && (
                <span className="form-error">{profileForm.formState.errors.profession.message}</span>
              )}

            </div>


            <div className="form-group">

              <label className="form-label">
                Bio
              </label>

              <textarea
                className="form-input"
                rows="3"
                {...profileForm.register('bio', {
                  maxLength: { value: 80, message: 'Maximum 80 characters allowed' }
                })}
              />
              {profileForm.formState.errors.bio && (
                <span className="form-error">{profileForm.formState.errors.bio.message}</span>
              )}

            </div>


            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              <FaSave />

              {saving
                ? 'Saving...'
                : 'Save Profile'}
            </button>

          </form>

        )}


        {/* ==================================================
            SECURITY
            ================================================== */}

        {activeTab === 'Security' && (

          <form
            onSubmit={
              passwordForm.handleSubmit(
                changePassword
              )
            }
          >

            <div className="form-group">

              <label className="form-label">
                New Password
              </label>

              <input
                className="form-input"
                type="password"
                {...passwordForm.register(
                  'newPassword',
                  {
                    required: true,
                  }
                )}
              />

            </div>


            <div className="form-group">

              <label className="form-label">
                Confirm Password
              </label>

              <input
                className="form-input"
                type="password"
                {...passwordForm.register(
                  'confirmPassword',
                  {
                    required: true,
                  }
                )}
              />

            </div>


            <button
              type="submit"
              className="btn btn-primary"
            >
              <FaSave />

              Update Password
            </button>

          </form>

        )}


        {/* ==================================================
            PREFERENCES
            ================================================== */}

        {activeTab === 'Preferences' && (

          <form
            onSubmit={
              prefsForm.handleSubmit(
                savePrefs
              )
            }
          >

            {/* ============================================
                APPEARANCE
                ============================================ */}

            <div className="settings-section">

              <div className="settings-section-title">

                <div>

                  <h2>
                    Appearance
                  </h2>

                  <p>
                    Choose light or dark mode
                  </p>

                </div>

              </div>


              <div className="mode-selector">

                {/* LIGHT */}

                <button
                  type="button"
                  className={`mode-option ${
                    theme === 'light'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setTheme('light')
                  }
                >

                  <span className="mode-icon">
                    <FaSun />
                  </span>

                  <span>
                    <strong>
                      Light
                    </strong>

                    <small>
                      Bright interface
                    </small>
                  </span>

                  {theme === 'light' && (
                    <span className="mode-check">
                      <FaCheck />
                    </span>
                  )}

                </button>


                {/* DARK */}

                <button
                  type="button"
                  className={`mode-option ${
                    theme === 'dark'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setTheme('dark')
                  }
                >

                  <span className="mode-icon">
                    <FaMoon />
                  </span>

                  <span>
                    <strong>
                      Dark
                    </strong>

                    <small>
                      Easy on the eyes
                    </small>
                  </span>

                  {theme === 'dark' && (
                    <span className="mode-check">
                      <FaCheck />
                    </span>
                  )}

                </button>

              </div>

            </div>


            {/* ============================================
                COLOR THEMES
                ============================================ */}

            <div className="settings-section">

              <div className="settings-section-title">

                <div>

                  <h2>
                    Color Theme
                  </h2>

                  <p>
                    Personalize your FinSync dashboard
                  </p>

                </div>

                <span className="current-theme-label">
                  {
                    colorThemes.find(
                      (item) =>
                        item.id === colorTheme
                    )?.name
                  }
                </span>

              </div>


              <div className="color-theme-grid">

                {colorThemes.map((item) => {

                  const selected =
                    colorTheme === item.id;

                  return (

                    <button
                      key={item.id}
                      type="button"
                      className={`color-theme-option ${
                        selected
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        changeColorTheme(
                          item.id
                        )
                      }
                      title={`Use ${item.name} theme`}
                    >

                      <span
                        className="color-preview"
                        style={{
                          background:
                            `linear-gradient(
                              135deg,
                              ${item.color},
                              ${item.secondary}
                            )`,
                        }}
                      />

                      <span className="color-theme-name">
                        {item.name}
                      </span>

                      {selected && (

                        <span className="selected-check">
                          <FaCheck />
                        </span>

                      )}

                    </button>

                  );
                })}

              </div>

            </div>


            {/* ============================================
                APP INSTALLATION (PWA)
                ============================================ */}

            <div className="settings-section">
              <div className="settings-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>App Installation</h2>
                  <p>Install FinSync to your home screen for a full-screen app experience.</p>
                </div>
                
                <button
                  type="button" // Important: prevents form submission
                  className="btn btn-outline"
                  onClick={handleInstallClick}
                >
                  <FaDownload style={{ marginRight: 6 }} /> Install App
                </button>
              </div>
            </div>


            {/* ============================================
                RESET
                ============================================ */}

            <div className="theme-actions">

              <button
                type="button"
                className="theme-reset-button"
                onClick={
                  handleResetTheme
                }
              >
                <FaUndo />

                Reset Theme
              </button>

            </div>


            {/* ============================================
                CURRENCY
                ============================================ */}

            <div className="form-group">

              <label className="form-label">
                Currency
              </label>

              <select
                className="form-input"
                {...prefsForm.register(
                  'currency'
                )}
              >

                {[
                  'INR',
                ].map((currency) => (

                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>

                ))}

              </select>

            </div>


            {/* ============================================
                TIMEZONE
                ============================================ */}

            <div className="form-group">

              <label className="form-label">
                Timezone
              </label>

              <input
                className="form-input"
                {...prefsForm.register(
                  'timezone'
                )}
                placeholder="e.g. Asia/Kolkata"
              />

            </div>


            {/* ============================================
                LANGUAGE
                ============================================ */}

            <div className="form-group">

              <label className="form-label">
                Language
              </label>

              <select
                className="form-input"
                {...prefsForm.register(
                  'language'
                )}
              >

                <option value="en">
                  English
                </option>

              </select>

            </div>


            {/* ============================================
                SAVE
                ============================================ */}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >

              <FaSave />

              {saving
                ? 'Saving...'
                : 'Save Preferences'}

            </button>

          </form>

        )}

      </motion.div>

    </div>
  );
};


export default Settings;