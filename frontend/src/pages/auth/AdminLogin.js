import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import Navbar from "../../components/HomePage/Navbar";
import Footer from "../../components/HomePage/Footer";
import {
  FaUserShield,
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaShieldAlt,
  FaArrowLeft
} from "react-icons/fa";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("login"); // login | forgot | verify
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  // Load saved email if exists
  useEffect(() => {
    const clearAdminAuth = () => {
      localStorage.setItem("adminForceReauth", "1");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      localStorage.removeItem("adminId");
      localStorage.removeItem("adminSession");
    };

    clearAdminAuth();
    window.addEventListener("pageshow", clearAdminAuth);

    const savedEmail = localStorage.getItem("adminEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    return () => window.removeEventListener("pageshow", clearAdminAuth);
  }, []);

  // Clear messages on step change
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [step]);

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async (e) => {
    e?.preventDefault();
    
    if (!email || !password) {
      setError("Email and Password required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("adminEmail", email);
      } else {
        localStorage.removeItem("adminEmail");
      }

      const res = await axios.post("http://localhost:5000/api/admin/login", {
        email,
        password
      });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));
      localStorage.setItem("adminId", res.data.admin.admin_id);
      localStorage.setItem("adminSession", JSON.stringify({
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        loggedInAt: Date.now()
      }));
      localStorage.removeItem("adminForceReauth");
      
      setSuccess("Login successful! Redirecting...");
      
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Invalid admin credentials");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    if (!email) {
      setError("Email required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      await axios.post("http://localhost:5000/api/admin/forgot-password", { email });
      
      setSuccess("OTP sent to your email!");
      setStep("verify");
      
    } catch (err) {
      setError(err.response?.data?.message || "Error sending OTP");
      console.error("Send OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const verifyOtp = async () => {
    if (!otp) {
      setError("OTP required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const res = await axios.post("http://localhost:5000/api/admin/verify-otp", {
        email,
        otp
      });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));
      localStorage.setItem("adminSession", JSON.stringify({
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        loggedInAt: Date.now()
      }));
      localStorage.removeItem("adminForceReauth");
      
      setSuccess("OTP verified! Redirecting...");
      
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
      console.error("Verify OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- HANDLE KEY PRESS ---------------- */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (step === "login" && !loading) handleLogin();
      else if (step === "forgot" && !loading) sendOtp();
      else if (step === "verify" && !loading) verifyOtp();
    }
  };

  /* ---------------- RENDER STEP INDICATOR ---------------- */
  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${step === "login" ? "active" : ""}`}>1</div>
      <div className="step-line"></div>
      <div className={`step ${step === "forgot" ? "active" : ""}`}>2</div>
      <div className="step-line"></div>
      <div className={`step ${step === "verify" ? "active" : ""}`}>3</div>
    </div>
  );

  /* ---------------- RENDER STEP CONTENT ---------------- */
  const renderStepContent = () => {
    switch (step) {
      case "login":
        return (
          <div className="step-content">
            {/* Error Alert */}
            {error && (
              <div className="alert alert-error">
                <FaExclamationCircle /> {error}
              </div>
            )}
            
            {/* Success Alert */}
            {success && (
              <div className="alert alert-success">
                <FaCheckCircle /> {success}
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">
                <FaEnvelope /> Admin Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="admin@wastewise.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">
                <FaLock /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '20px'
            }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="rememberMe" style={{ color: '#666', fontSize: '0.9rem' }}>
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button 
              className="btn" 
              onClick={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="loading-spinner" /> Authenticating...
                </>
              ) : (
                <>
                  <FaSignInAlt /> Login to Dashboard
                </>
              )}
            </button>

            {/* Forgot Password Link */}
            <p 
              onClick={() => setStep("forgot")}
              style={{ 
                cursor: "pointer", 
                textAlign: 'center',
                marginTop: '15px'
              }}
            >
              Forgot Password? <FaArrowRight style={{ fontSize: '0.9rem' }} />
            </p>
          </div>
        );

      case "forgot":
        return (
          <div className="step-content">
            <div className="alert alert-info">
              <FaKey /> Enter your email to receive an OTP
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaEnvelope /> Admin Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="admin@wastewise.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>

            <button 
              className="btn" 
              onClick={sendOtp} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="loading-spinner" /> Sending OTP...
                </>
              ) : (
                <>
                  <FaKey /> Send OTP to Email
                </>
              )}
            </button>

            <p 
              onClick={() => setStep("login")}
              style={{ 
                cursor: "pointer", 
                textAlign: 'center',
                marginTop: '15px'
              }}
            >
              <FaArrowLeft /> Back to Login
            </p>
          </div>
        );

      case "verify":
        return (
          <div className="step-content">
            <div className="alert alert-info">
              <FaKey /> Check your email for the OTP
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error">
                <FaExclamationCircle /> {error}
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="alert alert-success">
                <FaCheckCircle /> {success}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <FaEnvelope /> Verification Code
              </label>
              <input
                className="input"
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                disabled={loading}
                maxLength="6"
              />
              <small style={{ 
                display: 'block', 
                marginTop: '5px', 
                color: '#666',
                fontSize: '0.85rem'
              }}>
                Enter the 6-digit code sent to {email}
              </small>
            </div>

            <button 
              className="btn" 
              onClick={verifyOtp} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="loading-spinner" /> Verifying...
                </>
              ) : (
                <>
                  <FaCheckCircle /> Verify & Login
                </>
              )}
            </button>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '15px'
            }}>
              <p 
                onClick={() => setStep("forgot")}
                style={{ cursor: "pointer", fontSize: '0.9rem' }}
              >
                <FaArrowLeft /> Resend OTP
              </p>
              <p 
                onClick={() => setStep("login")}
                style={{ cursor: "pointer", fontSize: '0.9rem' }}
              >
                Back to Login <FaArrowRight />
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ---------------- MAIN RENDER ---------------- */
  return (
    <>
      <Navbar />
      <div className="page-with-navbar">
        <div className="card">
      <h2>
        {step === "login" && <><FaUserShield /> Admin Login</>}
        {step === "forgot" && <><FaKey /> Reset Password</>}
        {step === "verify" && <><FaKey /> Verify OTP</>}
      </h2>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      {renderStepContent()}

      {/* Security Badge */}
      <div className="security-badge">
        <FaShieldAlt />
        <span>Secure Admin Portal - WasteWise Management System</span>
      </div>

      {/* Footer */}
      <div className="card-footer">
        <p>© {new Date().getFullYear()} WasteWise. All rights reserved.</p>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          Back to Homepage
        </a>
      </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminLogin;
