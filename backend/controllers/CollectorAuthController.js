const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Collector = require("../models/Collector");
const OTPManager = require("../utils/OTPManager");
const EmailService = require("../utils/EmailService");

// ============ OTP LOGIN ============
// Step 1: Request OTP
exports.requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if collector exists
    const collector = await Collector.findByEmail(email);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found with this email"
      });
    }

    // Check if collector is approved
    if (collector.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${collector.status}. Please wait for admin approval.`,
        status: collector.status
      });
    }

    // Generate and send OTP
    const otpCode = OTPManager.createOTP(email, collector.collector_id);
    
    // Send OTP via email
    const emailResult = await EmailService.sendOTP(
      email, 
      otpCode, 
      collector.full_name
    );

    // For development, also log OTP to console
    console.log(`🔐 OTP for ${email}: ${otpCode}`);

    res.json({
      success: true,
      message: emailResult.devMode 
        ? "OTP generated (check console for dev mode)" 
        : "OTP sent to your email",
      email: email,
      otp: emailResult.devMode ? otpCode : undefined // Only send OTP in dev mode
    });

  } catch (err) {
    console.error("OTP Request Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process OTP request",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Step 2: Verify OTP and Login
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    // Verify OTP
    const verification = OTPManager.verifyOTP(email, otp);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Get collector details
    const collector = await Collector.findByEmail(email);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found"
      });
    }

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store session
    const sessionStore = require("../utils/SessionManager");
    sessionStore.createSession(token, {
      collectorId: collector.collector_id,
      email: collector.email,
      name: collector.full_name,
      collectionType: collector.collection_type,
      expiresAt: sessionExpiry
    });

    // Remove password from response
    const { password, ...collectorData } = collector;

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      collector: collectorData,
      expiresAt: sessionExpiry
    });

  } catch (err) {
    console.error("OTP Verification Error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============ EMAIL + PASSWORD LOGIN ============
exports.loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    // Get collector
    const collector = await Collector.findByEmail(email);
    if (!collector) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if approved
    if (collector.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${collector.status}. Please wait for admin approval.`,
        status: collector.status
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, collector.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);

    // Store session
    const sessionStore = require("../utils/SessionManager");
    sessionStore.createSession(token, {
      collectorId: collector.collector_id,
      email: collector.email,
      name: collector.full_name,
      collectionType: collector.collection_type,
      expiresAt: sessionExpiry
    });

    // Remove password
    const { password: _, ...collectorData } = collector;

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      collector: collectorData,
      expiresAt: sessionExpiry
    });

  } catch (err) {
    console.error("Password Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

// ============ FORGOT PASSWORD ============
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if collector exists
    const collector = await Collector.findByEmail(email);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found with this email"
      });
    }

    // Generate OTP for password reset
    const otpCode = OTPManager.createPasswordResetOTP(email, collector.collector_id);
    
    // Send OTP via email
    const emailResult = await EmailService.sendPasswordResetOTP(
      email, 
      otpCode, 
      collector.full_name
    );

    console.log(`🔐 Password Reset OTP for ${email}: ${otpCode}`);

    res.json({
      success: true,
      message: emailResult.devMode 
        ? "Password reset OTP generated (check console)" 
        : "Password reset OTP sent to your email",
      email: email,
      otp: emailResult.devMode ? otpCode : undefined
    });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request"
    });
  }
};

// ============ RESET PASSWORD WITH OTP ============
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Verify OTP for password reset
    const verification = OTPManager.verifyPasswordResetOTP(email, otp);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Get collector
    const db = require("../config/database");
    const [[collector]] = await db.execute(
      "SELECT * FROM Collectors WHERE email = ?",
      [email]
    );

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.execute(
      "UPDATE Collectors SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    // Delete OTP after successful reset
    OTPManager.deleteOTP(email);

    // Send confirmation email
    await EmailService.sendPasswordResetConfirmation(email, collector.full_name);

    res.json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to reset password"
    });
  }
};

// ============ CHANGE PASSWORD (Logged in) ============
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Get session
    const sessionStore = require("../utils/SessionManager");
    const session = sessionStore.getSession(token);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again."
      });
    }

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Get current collector
    const db = require("../config/database");
    const [[collector]] = await db.execute(
      "SELECT * FROM Collectors WHERE collector_id = ?",
      [session.collectorId]
    );

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, collector.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.execute(
      "UPDATE Collectors SET password = ? WHERE collector_id = ?",
      [hashedPassword, session.collectorId]
    );

    // Send email notification
    await EmailService.sendPasswordChangeNotification(collector.email, collector.full_name);

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};

// ============ RESEND OTP ============
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if collector exists and is approved
    const collector = await Collector.findByEmail(email);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found"
      });
    }

    if (collector.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: `Account is ${collector.status}`
      });
    }

    // Check if OTP already exists and hasn't expired
    if (OTPManager.hasOTP(email)) {
      const otpInfo = OTPManager.getOTPInfo(email);
      const timeLeft = Math.ceil((otpInfo.expiresAt - Date.now()) / 1000 / 60);
      
      return res.status(400).json({
        success: false,
        message: `OTP already sent. Wait ${timeLeft} minutes before requesting new OTP.`
      });
    }

    // Generate and send new OTP
    const otpCode = OTPManager.createOTP(email, collector.collector_id);
    
    // Send email
    await EmailService.sendOTP(email, otpCode, collector.full_name);

    // Log for dev
    console.log(`🔄 Resent OTP for ${email}: ${otpCode}`);

    res.json({
      success: true,
      message: "New OTP sent",
      email: email
    });

  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP"
    });
  }
};

// ============ LOGOUT ============
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const sessionStore = require("../utils/SessionManager");
      sessionStore.deleteSession(token);
    }

    res.json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
};