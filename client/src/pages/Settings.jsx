
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Bell,
  Palette,
  ShieldCheck,
  LogOut,
  Save,
  Mail,
  LockKeyhole,
  IndianRupee,
  Moon,
  Sun,
  CheckCircle2,
  Settings as SettingsIcon,
} from "lucide-react";

import "../styles/Settings.css";

function Settings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [preferences, setPreferences] = useState({
    lowBalanceAlerts: true,
    budgetAlerts: true,
    goalReminders: true,
    emailNotifications: false,
    appearance: "light",
    currency: "INR",
  });

  const [saved, setSaved] = useState(false);

  // Load saved profile and settings
  useEffect(() => {
    const savedUser = localStorage.getItem("spendwiseCurrentUser");
    const savedSettings = localStorage.getItem("spendwiseSettings");

    if (savedUser) {
      try {
        setProfile(JSON.parse(savedUser));
      } catch {
        console.error("Unable to load profile");
      }
    }

    if (savedSettings) {
      try {
        setPreferences((prev) => ({
          ...prev,
          ...JSON.parse(savedSettings),
        }));
      } catch {
        console.error("Unable to load settings");
      }
    }
  }, []);


  
// Apply and save appearance preference
useEffect(() => {
  document.documentElement.setAttribute(
    "data-theme",
    preferences.appearance
  );

  localStorage.setItem(
    "spendwiseSettings",
    JSON.stringify(preferences)
  );
}, [preferences]);


  // Update profile fields
  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved(false);
  };

  // Save profile
  const handleProfileSave = (e) => {
    e.preventDefault();

    if (!profile.name.trim() || !profile.email.trim()) {
      alert("Please enter your name and email.");
      return;
    }

    const updatedProfile = {
      name: profile.name.trim(),
      email: profile.email.trim(),
    };

    localStorage.setItem(
      "spendwiseCurrentUser",
      JSON.stringify(updatedProfile)
    );

    localStorage.setItem(
      "spendwiseRegisteredUser",
      JSON.stringify(updatedProfile)
    );

    setProfile(updatedProfile);
    setSaved(true);
    alert("Profile updated successfully!");
  };

  // Update preferences
  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSaved(false);
  };

  // Save preferences
  const handlePreferencesSave = () => {
    localStorage.setItem(
      "spendwiseSettings",
      JSON.stringify(preferences)
    );

    setSaved(true);
    alert("Preferences saved successfully!");
  };

  // Logout
  const handleLogout = () => {
  const confirmLogout = window.confirm(
    "Are you sure you want to logout?"
  );

  if (confirmLogout) {
    // Remove authentication tokens
    localStorage.removeItem("spendwiseAuthToken");
    sessionStorage.removeItem("spendwiseAuthToken");

    // Remove current user data
    localStorage.removeItem("spendwiseCurrentUser");

    // Redirect to login page
    navigate("/");
  }
};

  return (
    <div className="settings-page">

      {/* Page Header */}
      <div className="settings-header">
        <div>
          <span className="settings-eyebrow">
            ACCOUNT PREFERENCES
          </span>

          <h1>Settings</h1>

          <p>
            Manage your account, preferences and security.
          </p>
        </div>

        <div className="settings-header-icon">
          <SettingsIcon size={26} />
        </div>
      </div>

      {/* Profile Section */}
      <section className="settings-card">
        <div className="settings-section-heading">
          <div className="settings-icon-box">
            <UserRound size={21} />
          </div>

          <div>
            <h2>Profile Information</h2>
            <p>Update your personal account details.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave}>
          <div className="settings-profile-avatar">
            <div className="profile-avatar">
              {profile.name
                ? profile.name.charAt(0).toUpperCase()
                : "U"}
            </div>

            <div>
              <h3>{profile.name || "Your Name"}</h3>
              <p>{profile.email || "your@email.com"}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label>Full Name</label>

              <div className="settings-input-wrapper">
                <UserRound size={18} />

                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div className="settings-field">
              <label>Email Address</label>

              <div className="settings-input-wrapper">
                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          <div className="settings-card-footer">
            <button type="submit" className="settings-save-btn">
              <Save size={17} />
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="settings-card">
        <div className="settings-section-heading">
          <div className="settings-icon-box">
            <Bell size={21} />
          </div>

          <div>
            <h2>Notifications</h2>
            <p>Choose which alerts you want to receive.</p>
          </div>
        </div>

        <div className="settings-options">

          <div className="settings-option">
            <div className="settings-option-info">
              <h3>Low Balance Alerts</h3>
              <p>Get notified when your balance is low.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.lowBalanceAlerts}
                onChange={(e) =>
                  handlePreferenceChange(
                    "lowBalanceAlerts",
                    e.target.checked
                  )
                }
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          <div className="settings-option">
            <div className="settings-option-info">
              <h3>Budget Alerts</h3>
              <p>Get alerts when you approach your budget limit.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.budgetAlerts}
                onChange={(e) =>
                  handlePreferenceChange(
                    "budgetAlerts",
                    e.target.checked
                  )
                }
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          <div className="settings-option">
            <div className="settings-option-info">
              <h3>Savings Goal Reminders</h3>
              <p>Receive reminders about your savings goals.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.goalReminders}
                onChange={(e) =>
                  handlePreferenceChange(
                    "goalReminders",
                    e.target.checked
                  )
                }
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          <div className="settings-option">
            <div className="settings-option-info">
              <h3>Email Notifications</h3>
              <p>Receive account updates through email.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  handlePreferenceChange(
                    "emailNotifications",
                    e.target.checked
                  )
                }
              />
              <span className="settings-slider"></span>
            </label>
          </div>

        </div>

        <div className="settings-card-footer">
          <button
            type="button"
            className="settings-save-btn"
            onClick={handlePreferencesSave}
          >
            <Save size={17} />
            Save Preferences
          </button>
        </div>
      </section>

      {/* Appearance and Currency */}
      <section className="settings-card">
        <div className="settings-section-heading">
          <div className="settings-icon-box">
            <Palette size={21} />
          </div>

          <div>
            <h2>Appearance & Region</h2>
            <p>Customize your application preferences.</p>
          </div>
        </div>

        <div className="settings-form-grid">

          <div className="settings-field">
            <label>Appearance</label>

            <div className="settings-select-wrapper">
              {preferences.appearance === "dark" ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}

              <select
                value={preferences.appearance}
                onChange={(e) =>
                  handlePreferenceChange(
                    "appearance",
                    e.target.value
                  )
                }
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
          </div>

          <div className="settings-field">
            <label>Currency</label>

            <div className="settings-select-wrapper">
              <IndianRupee size={18} />

              <select
                value={preferences.currency}
                onChange={(e) =>
                  handlePreferenceChange(
                    "currency",
                    e.target.value
                  )
                }
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </select>
            </div>
          </div>

        </div>

        <div className="settings-card-footer">
          <button
            type="button"
            className="settings-save-btn"
            onClick={handlePreferencesSave}
          >
            <Save size={17} />
            Save Preferences
          </button>
        </div>
      </section>

      {/* Security Section */}
      <section className="settings-card">
        <div className="settings-section-heading">
          <div className="settings-icon-box">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h2>Security</h2>
            <p>Information about your account security.</p>
          </div>
        </div>

        <div className="security-info">
          <div className="security-info-icon">
            <LockKeyhole size={21} />
          </div>

          <div>
            <h3>Password Protection</h3>
            <p>
              Your account currently uses frontend demo
              authentication. Secure password management
              will be available after backend integration.
            </p>
          </div>
        </div>
      </section>

      {/* Logout Section */}
      <section className="settings-logout-card">
        <div>
          <h2>Logout from SpendWise</h2>
          <p>
            Sign out of your account on this device.
          </p>
        </div>

        <button
          type="button"
          className="settings-logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </section>

      {saved && (
        <div className="settings-saved-indicator">
          <CheckCircle2 size={17} />
          Changes saved
        </div>
      )}

    </div>
  );
}

export default Settings;
