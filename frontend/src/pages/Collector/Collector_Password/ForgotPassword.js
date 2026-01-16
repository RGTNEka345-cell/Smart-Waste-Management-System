import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../auth/CollectorLogin.css"; // Same CSS file

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // State management
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "otp") {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError("");
  };

  // Step 1: Request Password Reset OTP
  const handleRequestResetOTP = async () => {
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
      const response = await fetch("http://localhost:5000/api/collectors/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset OTP");
      }

      setSuccess("Password reset OTP sent to your email!");
      setStep(2);
      setCountdown(900); // 15 minutes
      setResendCooldown(60);
      
      if (data.otp) {
        console.log(`🔐 [DEV] Reset OTP for ${formData.email}: ${data.otp}`);
      }
      
    } catch (err) {
      setError(err.message || "Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyResetOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/collectors/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: "temporary", // Will be updated in step 3
          confirmPassword: "temporary"
        })
      });

      const data = await response.json();

      // We just want to verify OTP, not actually reset yet
      if (!response.ok && !data.message.includes("Passwords")) {
        throw new Error(data.message || "Invalid OTP");
      }

      // OTP is valid, move to password reset step
      setSuccess("OTP verified! Now set your new password.");
      setStep(3);
      
    } catch (err) {
      if (err.message.includes("Passwords do not match")) {
        // This is expected, OTP is valid
        setSuccess("OTP verified! Now set your new password.");
        setStep(3);
      } else {
        setError(err.message || "Invalid OTP");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please enter and confirm your new password");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/collectors/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess("Password reset successful! Redirecting to login...");
      
      // Redirect to login after delay
      setTimeout(() => {
        navigate("/collector/login");
      }, 2000);
      
    } catch (err) {
      setError(err.message || "Failed to reset password");
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
      const response = await fetch("http://localhost:5000/api/collectors/forgot-password", {
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
        console.log(`🔐 [DEV] New reset OTP for ${formData.email}: ${data.otp}`);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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

  // Back to previous step
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
    setError("");
    setSuccess("");
  };

  return (
    <div className="collector-login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo">🔐</div>
          <h1>Forgot Password</h1>
          <p className="login-subtitle">
            Reset your collector account password
          </p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Enter Email</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Verify OTP</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">New Password</div>
          </div>
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

        {/* Step 1: Email Input */}
        {step === 1 && (
          <div className="login-step">
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
                />
              </div>
              <p className="input-hint">
                Enter the email associated with your collector account
              </p>
            </div>

            <button
              onClick={handleRequestResetOTP}
              disabled={isLoading || !formData.email}
              className="login-btn primary"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Sending Reset OTP...
                </>
              ) : (
                <>
                  <i className="btn-icon">🔐</i>
                  Send Reset OTP
                </>
              )}
            </button>

            <div className="back-to-login">
              <Link to="/collector/login" className="back-link">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="login-step">
            <div className="step-header">
              <button 
                onClick={handleBack}
                className="back-btn"
                disabled={isLoading}
              >
                ← Back
              </button>
              <h3>Verify OTP</h3>
            </div>

            <div className="otp-info-card">
              <div className="email-display">
                <i className="email-icon">📧</i>
                <span className="email-text">{formData.email}</span>
              </div>
              <p className="otp-instruction">
                Enter the 6-digit OTP sent to your email
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
              <label htmlFor="otp">6-Digit OTP Code</label>
              <div className="otp-input-container">
                <input
                  type="text"
                  id="otp"
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
                onClick={handleVerifyResetOTP}
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
                    Verify OTP
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <div className="login-step">
            <div className="step-header">
              <button 
                onClick={handleBack}
                className="back-btn"
                disabled={isLoading}
              >
                ← Back
              </button>
              <h3>Set New Password</h3>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-with-icon">
                <i className="input-icon">🔒</i>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="form-input"
                  autoFocus
                />
              </div>
              <p className="password-hint">
                Minimum 6 characters
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-with-icon">
                <i className="input-icon">🔒</i>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="form-input"
                />
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
              className="login-btn primary"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Resetting Password...
                </>
              ) : (
                <>
                  <i className="btn-icon">✅</i>
                  Reset Password
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p className="security-note">
            <i className="security-icon">🔒</i>
            Your security is our priority
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;