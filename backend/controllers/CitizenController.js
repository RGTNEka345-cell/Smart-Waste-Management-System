// controllers/CitizenController.js
const Citizen = require("../models/Citizen");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const db = require("../config/database");
const sendEmail = require("../utils/sendEmail");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate OTP and expiration (10 minutes)
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const getExpirationTime = () => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  return expiresAt;
};

exports.register = async (req, res) => {
  try {
    // Accept both JSON and multipart/form-data (multer populates req.file and req.body)
    const body = req.body || {};

    const { full_name, email, phone, password, address, date_of_birth, gender, latitude, longitude } = body;

    // If photo uploaded via multer, set photo_url to accessible path
    let photo_url = body.photo_url || null;
    if (req.file && req.file.filename) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    // Check for required fields
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Check if email already exists
    const existingUser = await Citizen.findByEmail(email);
    if (existingUser && existingUser.length > 0) {
  return res.status(409).json({ message: "Email already registered" });
}

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create citizen (unverified)
    const result = await Citizen.create({
      full_name,
      email,
      phone,
      password: hashedPassword,
      address,
      date_of_birth,
      gender,
      latitude,
      longitude,
      photo_url
    });

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = getExpirationTime();

    // Store OTP in database
    await Citizen.updateOTP(email, otpCode, expiresAt);

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification - Smart Waste Management",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2ecc71;">Welcome to Smart Waste Management!</h2>
          <p>Thank you for registering. Your verification code is:</p>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #2c3e50; letter-spacing: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Smart Waste Management System<br>
            Cleaner Cities, Smarter Future
          </p>
        </div>
      `
    };

    if (process.env.MAIL_FALLBACK === "true") {
      console.log(`OTP for ${email}: ${otpCode}`);
      res.json({ 
        success: true, 
        message: "Registration successful. OTP sent to email.",
        email,
        otp: otpCode, // Only for development/testing
        userId: result[0].insertId
      });
    } else {
      await transporter.sendMail(mailOptions);
      res.json({ 
        success: true, 
        message: "Registration successful. OTP sent to email.",
        email,
        userId: result[0].insertId
      });
    }

  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: "Registration Failed" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    // Verify OTP from database
    const isValid = await Citizen.verifyOTP(email, otp);

    if (isValid) {
      res.json({ 
        success: true, 
        message: "Email verified successfully. You can now login." 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: "Invalid or expired OTP" 
      });
    }

  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // Check if user exists
    const user = await Citizen.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = getExpirationTime();

    // Update OTP in database
    await Citizen.resendOTP(email, otpCode, expiresAt);

    // Send new OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "New Verification Code - Smart Waste Management",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2ecc71;">New Verification Code</h2>
          <p>Your new verification code is:</p>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #2c3e50; letter-spacing: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Smart Waste Management System<br>
            Cleaner Cities, Smarter Future
          </p>
        </div>
      `
    };

    if (process.env.MAIL_FALLBACK === "true") {
      console.log(`New OTP for ${email}: ${otpCode}`);
      res.json({ 
        success: true, 
        message: "New OTP sent to email.",
        otp: otpCode // Only for development/testing
      });
    } else {
      await transporter.sendMail(mailOptions);
      res.json({ 
        success: true, 
        message: "New OTP sent to email." 
      });
    }

  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//logincitizen

// controllers/CitizenController.js
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await Citizen.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Please verify your email before login"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Send full citizen details
    res.json({
      success: true,
      message: "Login successful",
      citizen: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        latitude: user.latitude,
        longitude: user.longitude,
        photo_url: user.photo_url,
        is_verified: user.is_verified,
        points: user.points || 0,
        next_collection: user.next_collection || null
      },
      token: "token_goes_here_if_you_use_jwt"
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // Check if user exists
    const user = await Citizen.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = getExpirationTime();

    // Store OTP in database
    await Citizen.updateOTP(email, otpCode, expiresAt);

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code - Smart Waste Management",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2ecc71;">Password Reset Request</h2>
          <p>You requested to reset your password. Your verification code is:</p>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #2c3e50; letter-spacing: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Smart Waste Management System<br>
            Cleaner Cities, Smarter Future
          </p>
        </div>
      `
    };

    if (process.env.MAIL_FALLBACK === "true") {
      console.log(`Password reset OTP for ${email}: ${otpCode}`);
      res.json({ 
        success: true, 
        message: "OTP sent to email.",
        email,
        otp: otpCode // Only for development/testing
      });
    } else {
      await transporter.sendMail(mailOptions);
      res.json({ 
        success: true, 
        message: "OTP sent to your email. Please check your inbox.",
        email
      });
    }

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Verify OTP
    const isValidOTP = await Citizen.verifyOTPForReset(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check if user exists
    const user = await Citizen.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await Citizen.updatePassword(email, hashedPassword);

    // Clear OTP
    await Citizen.clearOTPAfterReset(email);

    res.json({ 
      success: true, 
      message: "Password reset successful. You can now login with your new password." 
    });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// GET citizen by ID (optional, for future use)


//


// UPDATE citizen profile
exports.updateProfile = async (req, res) => {
  try {
    const citizenId = req.params.id;

    const {
      full_name,
      phone,
      address,
      date_of_birth,
      gender,
      latitude,
      longitude,
      email
    } = req.body;

    // find citizen
    const existing = await Citizen.findById(citizenId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Citizen not found"
      });
    }

    // photo
    let photo_url = existing.photo_url;
    if (req.file) {
      photo_url = `/uploads/citizens/${req.file.filename}`;
    }

    // email logic
    const newEmail =
      email && email.trim() !== "" ? email.trim() : existing.email;

    const emailChanged = newEmail !== existing.email;

    // update DB
    const updatedCitizen = await Citizen.updateById(citizenId, {
      full_name,
      phone,
      address,
      date_of_birth,
      gender,
      latitude,
      longitude,
      photo_url,
      email: newEmail
    });

    // 📧 SEND EMAIL AFTER UPDATE
    try {
      await sendEmail({
        to: newEmail,
        subject: "Profile Updated Successfully",
        html: `
          <h2>Profile Updated</h2>
          <p>Your profile has been updated successfully.</p>

          <h4>Updated Details:</h4>
          <ul>
            <li><b>Name:</b> ${full_name}</li>
            <li><b>Email:</b> ${newEmail}</li>
            <li><b>Phone:</b> ${phone}</li>
            <li><b>Address:</b> ${address}</li>
            <li><b>Gender:</b> ${gender}</li>
            <li><b>Date of Birth:</b> ${date_of_birth}</li>
          </ul>

          <p>If you did not perform this update, please contact support.</p>
        `
      });
    } catch (mailError) {
      console.error("Email send failed:", mailError.message);
    }

    res.json({
      success: true,
      message: emailChanged
        ? "Profile updated & email notification sent"
        : "Profile updated successfully",
      citizen: updatedCitizen
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};





