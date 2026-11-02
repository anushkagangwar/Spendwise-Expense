
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../services/api";
import {
  CircleDollarSign,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

import "../styles/signup.css";

function Signup() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please accept the Terms and Conditions.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/auth/register`,
  {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      // Save JWT token and user details
      localStorage.setItem("spendwiseAuthToken", data.token);
      localStorage.setItem(
        "spendwiseCurrentUser",
        JSON.stringify(data.user)
      );

      // Redirect after successful registration
      navigate("/dashboard");

    } catch (err) {
      setError(
        err.message || "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">

      {/* Left Branding Section */}
      <section className="signup-brand-section">

        <div className="signup-brand-logo">
          <div className="signup-logo-icon">
            <CircleDollarSign size={28} />
          </div>
          <h2>SpendWise</h2>
        </div>

        <div className="signup-brand-content">
          <span className="signup-tag">START YOUR FINANCIAL JOURNEY</span>

          <h1>
            Build better
            <br />
            money <span>habits.</span>
          </h1>

          <p>
            Create your SpendWise account and take the first
            step towards smarter spending, saving and financial planning.
          </p>

          <div className="signup-trust">
            <ShieldCheck size={20} />
            <span>A smarter way to manage your money.</span>
          </div>
        </div>

        <div className="signup-brand-footer">
          © 2026 SpendWise. All rights reserved.
        </div>

      </section>

      {/* Right Signup Section */}
      <section className="signup-form-section">

        <div className="signup-form-container">

          <div className="signup-mobile-logo">
            <CircleDollarSign size={27} />
            <span>SpendWise</span>
          </div>

          <div className="signup-heading">
            <span>GET STARTED</span>
            <h1>Create your account</h1>
            <p>Join SpendWise and manage your finances smarter.</p>
          </div>

          <form onSubmit={handleSignup}>

            {/* Full Name */}
            <div className="signup-input-group">
              <label htmlFor="name">Full Name</label>

              <div className="signup-input-wrapper">
                <UserRound size={19} />

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="signup-input-group">
              <label htmlFor="signup-email">Email Address</label>

              <div className="signup-input-wrapper">
                <Mail size={19} />

                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="signup-input-group">
              <label htmlFor="signup-password">Password</label>

              <div className="signup-input-wrapper">
                <LockKeyhole size={19} />

                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="signup-input-group">
              <label htmlFor="confirm-password">Confirm Password</label>

              <div className="signup-input-wrapper">
                <LockKeyhole size={19} />

                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="signup-terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />

              <span>
                I agree to the Terms and Conditions and Privacy Policy.
              </span>
            </label>

            {/* Error Message */}
            {error && (
              <p className="signup-error" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="signup-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight size={19} />}
            </button>

          </form>

          <p className="signup-login-text">
            Already have an account?
            <Link to="/"> Sign in</Link>
          </p>

        </div>

      </section>

    </div>
  );
}

export default Signup;
