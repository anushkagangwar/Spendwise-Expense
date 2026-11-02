
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../services/api";

import {
  CircleDollarSign,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      // Save authentication token
      if (rememberMe) {
        localStorage.setItem("spendwiseAuthToken", data.token);
      } else {
        sessionStorage.setItem("spendwiseAuthToken", data.token);
        localStorage.removeItem("spendwiseAuthToken");
      }

      // Save logged-in user details
      localStorage.setItem(
        "spendwiseCurrentUser",
        JSON.stringify(data.user)
      );

      navigate("/dashboard");

    } catch (err) {
      setError(
        err.message || "Unable to connect to server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Left Branding Section */}
      <section className="login-brand-section">

        <div className="login-brand-logo">
          <div className="login-logo-icon">
            <CircleDollarSign size={28} />
          </div>
          <h2>SpendWise</h2>
        </div>

        <div className="login-brand-content">
          <span className="login-tag">SMART MONEY. SMARTER LIFE.</span>

          <h1>
            Take control of
            <br />
            your <span>financial future.</span>
          </h1>

          <p>
            Track your expenses, manage your savings and
            make smarter financial decisions — all in one place.
          </p>

          <div className="login-trust">
            <ShieldCheck size={20} />
            <span>Your finances, organized and secure.</span>
          </div>
        </div>

        <div className="login-brand-footer">
          © 2026 SpendWise. All rights reserved.
        </div>

      </section>

      {/* Right Login Section */}
      <section className="login-form-section">

        <div className="login-form-container">

          <div className="login-mobile-logo">
            <CircleDollarSign size={27} />
            <span>SpendWise</span>
          </div>

          <div className="login-heading">
            <span>WELCOME BACK</span>
            <h1>Sign in to your account</h1>
            <p>Enter your details to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="login-input-group">
              <label htmlFor="email">Email Address</label>

              <div className="login-input-wrapper">
                <Mail size={19} />

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-input-group">
              <label htmlFor="password">Password</label>

              <div className="login-input-wrapper">
                <LockKeyhole size={19} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => alert("Forgot password feature coming soon!")}
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
              {!isLoading && <ArrowRight size={19} />}
            </button>

          </form>

          <p className="login-signup-text">
            Don't have an account?
            <Link to="/signup"> Create an account</Link>
          </p>

        </div>

      </section>

    </div>
  );
}

export default Login;
