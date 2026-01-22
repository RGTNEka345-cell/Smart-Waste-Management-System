import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./CollectorLogin.css";

const CollectorLogin = () => {
  const navigate = useNavigate();
  
  // State management
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [step, setStep] = useState(1); // For OTP: 1: Email, 2: OTP
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: ""
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "otp") {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      
      if (numericValue.length === 6 && step === 2) {
        setTimeout(() => handleVerifyOTP(), 100);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError("");
  };

  // ============ PASSWORD LOGIN ============
  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/collectors/login-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store session data
      localStorage.setItem("collectorToken", data.token);
      localStorage.setItem("collectorData", JSON.stringify(data.collector));
      localStorage.setItem("collectorSession", JSON.stringify({
        expiresAt: data.expiresAt,
        loggedInAt: Date.now()
      }));
      
      setSuccess("Login successful! Redirecting...");
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate("/collector/dashboard");
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ============ OTP LOGIN ============
  // Request OTP
  const handleRequestOTP = async () => {
    if (!formData.email) {
      setError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/collectors/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setSuccess("OTP sent to your email! Check your inbox.");
      setStep(2);
      setCountdown(600); // 10 minutes
      setResendCooldown(60); // 60 seconds cooldown
      
      // Clear OTP field
      setFormData(prev => ({ ...prev, otp: "" }));
      
      // Log OTP for development
      if (data.otp) {
        console.log(`🔐 [DEV] OTP for ${formData.email}: ${data.otp}`);
      }
      
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/collectors/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      // Store session data
      localStorage.setItem("collectorToken", data.token);
      localStorage.setItem("collectorData", JSON.stringify(data.collector));
      localStorage.setItem("collectorSession", JSON.stringify({
        expiresAt: data.expiresAt,
        loggedInAt: Date.now()
      }));
      
      setSuccess("Login successful! Redirecting...");
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate("/collector/dashboard");
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/collectors/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setSuccess("New OTP sent! Check your email.");
      setFormData(prev => ({ ...prev, otp: "" }));
      setResendCooldown(60);
      
      if (data.otp) {
        console.log(`🔐 [DEV] New OTP for ${formData.email}: ${data.otp}`);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Back to email step (for OTP)
  const handleBackToEmail = () => {
    setStep(1);
    setError("");
    setSuccess("");
  };

  // Switch login method
  const handleMethodChange = (method) => {
    setLoginMethod(method);
    setStep(1);
    setFormData({ email: "", password: "", otp: "" });
    setError("");
    setSuccess("");
    setCountdown(0);
    setResendCooldown(0);
  };

  // Countdown timers
  useEffect(() => {
    const timers = [];
    
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      timers.push(timer);
    }
    
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      timers.push(timer);
    }
    
    return () => timers.forEach(timer => clearInterval(timer));
  }, [countdown, resendCooldown]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Enter key for password login
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && loginMethod === 'password') {
      handlePasswordLogin();
    }
  };

  // Auto-focus OTP input
  useEffect(() => {
    if (step === 2 && loginMethod === "otp") {
      const otpInput = document.getElementById("otp-input");
      if (otpInput) {
        setTimeout(() => otpInput.focus(), 100);
      }
    }
  }, [step, loginMethod]);

  return (
    <div className="collector-login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo">♻️</div>
          <h1>Collector Login</h1>
          <p className="login-subtitle">
            Access your waste collection dashboard
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="method-toggle">
          <button
            className={`toggle-btn ${loginMethod === "password" ? "active" : ""}`}
            onClick={() => handleMethodChange("password")}
            disabled={isLoading}
          >
            <i className="icon">🔑</i> Email & Password
          </button>
          <button
            className={`toggle-btn ${loginMethod === "otp" ? "active" : ""}`}
            onClick={() => handleMethodChange("otp")}
            disabled={isLoading}
          >
            <i className="icon">🔐</i> OTP Login
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert error">
            <i className="alert-icon">⚠️</i>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert success">
            <i className="alert-icon">✅</i>
            <span>{success}</span>
          </div>
        )}

        {/* ============ PASSWORD LOGIN FORM ============ */}
        {loginMethod === "password" && (
          <form onSubmit={handlePasswordLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <i className="input-icon">📧</i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your registered email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="form-input"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <i className="input-icon">🔒</i>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="form-input"
                  required
                />
              </div>
              <div className="password-options">
                <Link to="/collector/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="login-btn primary"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="btn-icon">→</i>
                  Login with Password
                </>
              )}
            </button>
          </form>
        )}

        {/* ============ OTP LOGIN FORM ============ */}
        {loginMethod === "otp" && (
          <div className="otp-login">
            {/* Step 1: Email Input */}
            {step === 1 && (
              <div className="login-step">
                <div className="form-group">
                  <label htmlFor="otp-email">Email Address</label>
                  <div className="input-with-icon">
                    <i className="input-icon">📧</i>
                    <input
                      type="email"
                      id="otp-email"
                      name="email"
                      placeholder="Enter your registered email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="form-input"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  onClick={handleRequestOTP}
                  disabled={isLoading || !formData.email}
                  className="login-btn primary"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <i className="btn-icon">🔐</i>
                      Send OTP to Email
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: OTP Input */}
            {step === 2 && (
              <div className="login-step">
                <div className="step-header">
                  <button 
                    onClick={handleBackToEmail}
                    className="back-btn"
                    disabled={isLoading}
                  >
                    ← Back
                  </button>
                  <h3>Enter OTP</h3>
                </div>

                <div className="otp-info-card">
                  <div className="email-display">
                    <i className="email-icon">📧</i>
                    <span className="email-text">{formData.email}</span>
                  </div>
                  <p className="otp-instruction">
                    Enter the 6-digit code sent to your email
                  </p>
                  
                  {countdown > 0 && (
                    <div className="timer-display">
                      <i className="timer-icon">⏱️</i>
                      <span>OTP expires in: </span>
                      <span className="timer">{formatTime(countdown)}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="otp-input">6-Digit OTP Code</label>
                  <div className="otp-input-container">
                    <input
                      type="text"
                      id="otp-input"
                      name="otp"
                      placeholder="000000"
                      value={formData.otp}
                      onChange={handleInputChange}
                      maxLength="6"
                      disabled={isLoading}
                      className="form-input otp-input"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading || resendCooldown > 0}
                    className="login-btn secondary"
                  >
                    {resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      <>
                        <i className="btn-icon">🔄</i>
                        Resend OTP
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || formData.otp.length !== 6}
                    className="login-btn primary"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="btn-icon">✅</i>
                        Verify & Login
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alternative Options */}
        <div className="alternative-options">
          <p className="or-divider">OR</p>
          <button 
            onClick={() => navigate("/register/collector")}
            className="alt-btn"
            disabled={isLoading}
          >
            <i className="alt-icon">📝</i>
            New Collector? Register Here
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="security-note">
            <i className="security-icon">🔒</i>
            Secure authentication system
          </p>
          <p className="support-link">
            Need help? <Link to="/support">Contact Support</Link>
          </p>
            <p className="Home-link">
            Back to homepage <Link to="/about">Contact Support</Link>
          </p> 
        </div>
        
      </div>
    </div>
  );
};

export default CollectorLogin;