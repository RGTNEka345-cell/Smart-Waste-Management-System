import React, { useState } from "react";
import axios from "axios";
import "./CitizenLogin.css";

const CitizenLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert("Email and Password required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      // 🔹 backend endpoint eka ready nam
      await axios.post("http://localhost:5000/api/citizen/login", {
        email,
        password
      });

      if (rememberMe) {
        localStorage.setItem("citizenEmail", email);
      } else {
        localStorage.removeItem("citizenEmail");
      }

      alert("Login Successful");
      window.location.href = "/citizen/dashboard"; // redirect
    } catch (err) {
      alert(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on component mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem("citizenEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <div className="recycle-icon">♻️</div>
            </div>
            <h1>SmartWaste</h1>
          </div>
          <h2>Citizen Login</h2>
          <p className="subtitle">Access your waste management dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">
              <span className="label-icon">📧</span> Email Address
            </label>
            <input
              id="email"
              className="input-field"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <span className="label-icon">🔒</span> Password
            </label>
            <input
              id="password"
              className="input-field"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="login-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          <button 
            type="submit" 
            className="login-btn" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              "Login to Dashboard"
            )}
          </button>
        </form>

        <div className="divider">
          <span>Or continue with</span>
        </div>

        <div className="social-login">
          <button className="social-btn google-btn">
            <span>G</span> Google
          </button>
          <button className="social-btn municipal-btn">
            <span>🏢</span> Municipal ID
          </button>
        </div>

        <p className="register-link">
          New to SmartWaste? <a href="/register/citizen">Create Citizen Account</a>
        </p>

        <div className="login-footer">
          <p>
            <a href="/">← Back to Home</a> | 
            <a href="/info"> How it works?</a> | 
            <a href="/contact"> Need help?</a>
          </p>
          <p className="copyright">
            © {new Date().getFullYear()} Smart Waste Management System
          </p>
        </div>
      </div>

      <div className="login-sidepanel">
        <div className="sidepanel-content">
          <h3>Smart Waste Management Benefits</h3>
          <ul className="features-list">
            <li>
              <span className="feature-icon">📊</span>
              <div>
                <strong>Real-time Tracking</strong>
                <p>Monitor waste collection schedules and status</p>
              </div>
            </li>
            <li>
              <span className="feature-icon">🏆</span>
              <div>
                <strong>Reward Points</strong>
                <p>Earn rewards for proper waste segregation</p>
              </div>
            </li>
            <li>
              <span className="feature-icon">📱</span>
              <div>
                <strong>Mobile Notifications</strong>
                <p>Get alerts for collection days and changes</p>
              </div>
            </li>
            <li>
              <span className="feature-icon">🌱</span>
              <div>
                <strong>Eco Impact</strong>
                <p>Track your environmental contribution</p>
              </div>
            </li>
          </ul>
          
          <div className="stats-panel">
            <div className="stat-item">
              <h4>50,000+</h4>
              <p>Active Citizens</p>
            </div>
            <div className="stat-item">
              <h4>85%</h4>
              <p>Recycling Rate</p>
            </div>
            <div className="stat-item">
              <h4>2,500+</h4>
              <p>Tons Diverted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenLogin;