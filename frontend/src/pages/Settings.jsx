import { useState } from 'react';

import { motion } from 'framer-motion';

import { useForm } from 'react-hook-form';

import { toast } from 'react-toastify';

import {
  FaSave,
  FaSun,
  FaMoon,
  FaCheck,
  FaUndo,
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
     PROFILE FORM
     ======================================================== */

  const profileForm = useForm({
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

  const passwordForm = useForm();


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
                {...profileForm.register('name')}
              />

            </div>


            <div className="form-group">

              <label className="form-label">
                Phone
              </label>

              <input
                className="form-input"
                {...profileForm.register('phone')}
              />

            </div>


            <div className="form-group">

              <label className="form-label">
                Location
              </label>

              <input
                className="form-input"
                {...profileForm.register('location')}
              />

            </div>


            <div className="form-group">

              <label className="form-label">
                Profession
              </label>

              <input
                className="form-input"
                {...profileForm.register('profession')}
              />

            </div>


            <div className="form-group">

              <label className="form-label">
                Bio
              </label>

              <textarea
                className="form-input"
                rows="3"
                {...profileForm.register('bio')}
              />

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