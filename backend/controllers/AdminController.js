const Admin = require("../models/Admin");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const otps = {}; // { email: otp }

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const bcrypt = require("bcryptjs");
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { admin_id: admin.admin_id, role: admin.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      admin: {
        admin_id: admin.admin_id,
        fullname: admin.fullname,
        role: admin.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otps[email] = otp;

    if (process.env.MAIL_FALLBACK === "true") {
      console.log("ADMIN OTP:", otp);
    } else {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: "Admin OTP Verification",
        text: `Your OTP is ${otp}`
      });
    }

    res.json({ message: "OTP sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP send failed" });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!otps[email] || otps[email] != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    delete otps[email];

    const admin = await Admin.findByEmail(email);

    const token = jwt.sign(
      { admin_id: admin.admin_id, role: admin.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      admin: {
        admin_id: admin.admin_id,
        fullname: admin.fullname,
        role: admin.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};
