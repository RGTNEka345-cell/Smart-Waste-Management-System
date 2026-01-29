import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CitizenLogin.css";
import Navbar from "../../components/HomePage/Navbar";
import Footer from "../../components/HomePage/Footer";

const CitizenLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);


  // pass user data
  
  const handleLogin = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    alert("Email and Password required");
    return;
  }

  try {
    setLoading(true);

    // 👉 මෙතන තමයි API call එක
    const res = await axios.post(
      "http://localhost:5000/api/citizen/login",
      { email, password }
    );

    // ✅ 👉 මෙතන තමයි SAVE කරන්න ඕන
    localStorage.setItem(
      "citizen",
      JSON.stringify(res.data.citizen)
    );
    localStorage.setItem(
      "citizenToken",
      res.data.token
    );

    // (optional)
    if (rememberMe) {
      localStorage.setItem("citizenEmail", email);
    } else {
      localStorage.removeItem("citizenEmail");
    }

    // 👉 redirect
    window.location.href = "/citizen/dashboard";

  } catch (err) {
    alert(err.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  // Load remembered email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("citizenEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-with-navbar">
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="login-btn" disabled={loading}>
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
          New to SmartWaste?{" "}
          <a href="/register/citizen">Create Citizen Account</a>
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

      

          
        
       
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CitizenLogin;
