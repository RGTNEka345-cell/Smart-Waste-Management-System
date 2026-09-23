const Admin = require("../models/Admin");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const bcrypt = require("bcryptjs");

const otps = {}; // { email: otp }
const profileOtps = new Map(); // adminId -> { otp, expiresAt }

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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

// ================= ADMIN STATS =================
exports.getAdminStats = async (req, res) => {
  try {
    const [[citizenCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM citizens"
    );

    const [[maleCollectorCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM Collectors WHERE LOWER(gender) = 'male'"
    );

    const [[femaleCollectorCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM Collectors WHERE LOWER(gender) = 'female'"
    );

    res.json({
      citizens: citizenCount?.total || 0,
      maleCollectors: maleCollectorCount?.total || 0,
      femaleCollectors: femaleCollectorCount?.total || 0,
      collectors:
        (maleCollectorCount?.total || 0) + (femaleCollectorCount?.total || 0)
    });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).json({ message: "Failed to load admin stats" });
  }
};

exports.getPublicStats = async (req, res) => {
  try {
    const [[citizenCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM citizens"
    );

    const [[collectorCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM Collectors WHERE LOWER(gender) = 'male'"
    );

    const [[femaleCollectorCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM Collectors WHERE LOWER(gender) = 'female'"
    );

    const [[adminCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM admins"
    );

    const [[pickupRequestCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM pickup_requests"
    );

    res.json({
      activeUsers:
        (citizenCount?.total || 0) +
        (collectorCount?.total || 0) +
        (femaleCollectorCount?.total || 0) +
        (adminCount?.total || 0),
      citizens: citizenCount?.total || 0,
      collectors:
        (collectorCount?.total || 0) + (femaleCollectorCount?.total || 0),
      requests: pickupRequestCount?.total || 0
    });
  } catch (err) {
    console.error("Public stats error:", err.message);
    res.status(500).json({ message: "Failed to load public stats" });
  }
};

// ================= ADMIN PROFILE =================
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT admin_id, fullname, gender, email, photo, phone_number, address, role, created_at
       FROM admins
       WHERE admin_id = ?`,
      [req.adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = rows[0];
    if (admin.photo && !admin.photo.startsWith("/uploads/")) {
      admin.photo = `/uploads/admins/${admin.photo}`;
    }

    return res.json(admin);
  } catch (err) {
    console.error("Get admin profile error:", err.message);
    return res.status(500).json({ message: "Failed to load admin profile" });
  }
};

exports.requestProfileOtp = async (req, res) => {
  try {
    const [[admin]] = await db.execute(
      `SELECT email FROM admins WHERE admin_id = ?`,
      [req.adminId]
    );

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    profileOtps.set(req.adminId, { otp, expiresAt });

    if (process.env.MAIL_FALLBACK === "true") {
      console.log("ADMIN PROFILE OTP:", otp);
      return res.json({ message: "OTP sent", otp });
    }

    await transporter.sendMail({
      from: process.env.MAIL_USER || process.env.EMAIL_USER,
      to: admin.email,
      subject: "Admin Profile Update OTP",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`
    });

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Request profile OTP error:", err.message);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullname, phone_number, address, otp } = req.body || {};

    if (!fullname || !fullname.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }

    const otpRecord = profileOtps.get(req.adminId);
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP required" });
    }
    if (Date.now() > otpRecord.expiresAt) {
      profileOtps.delete(req.adminId);
      return res.status(400).json({ message: "OTP expired" });
    }
    if (String(otp || "").trim() !== String(otpRecord.otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const fields = ["fullname = ?", "phone_number = ?", "address = ?"];
    const values = [fullname.trim(), phone_number || null, address || null];

    if (req.file) {
      fields.push("photo = ?");
      values.push(`/uploads/admins/${req.file.filename}`);
    }

    values.push(req.adminId);

    await db.execute(
      `UPDATE admins SET ${fields.join(", ")} WHERE admin_id = ?`,
      values
    );

    profileOtps.delete(req.adminId);
    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("Update admin profile error:", err.message);
    return res.status(500).json({ message: "Profile update failed" });
  }
};

// ================= SUB ADMIN (MAIN ADMIN ONLY) =================
exports.createSubAdmin = async (req, res) => {
  try {
    const { fullname, gender, email, password, phone_number, address } = req.body || {};

    const [[requester]] = await db.execute(
      `SELECT role FROM admins WHERE admin_id = ?`,
      [req.adminId]
    );
    if (!requester) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (requester.role !== "main_admin") {
      return res.status(403).json({ message: "Only main_admin can create sub admins" });
    }

    if (!fullname || !fullname.trim()) return res.status(400).json({ message: "Full name is required" });
    if (!email || !email.trim()) return res.status(400).json({ message: "Email is required" });
    if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const [[existing]] = await db.execute(
      `SELECT admin_id FROM admins WHERE email = ?`,
      [email.trim()]
    );
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const photoPath = req.file ? `/uploads/admins/${req.file.filename}` : null;

    const [result] = await db.execute(
      `INSERT INTO admins
       (fullname, gender, email, password, photo, phone_number, address, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sub_admin')`,
      [
        fullname.trim(),
        gender || null,
        email.trim(),
        hashedPassword,
        photoPath,
        phone_number || null,
        address || null
      ]
    );

    if (process.env.MAIL_FALLBACK === "true") {
      console.log("SUB ADMIN ACCOUNT:", {
        email: email.trim(),
        password
      });
    } else {
      await transporter.sendMail({
        from: process.env.MAIL_USER || process.env.EMAIL_USER,
        to: email.trim(),
        subject: "Sub Admin Account Created",
        text:
          "Your sub admin account has been created.\n" +
          `Email: ${email.trim()}\n` +
          `Password: ${password}`
      });
    }

    return res.status(201).json({
      success: true,
      message: "Sub admin created successfully",
      admin_id: result.insertId
    });
  } catch (err) {
    console.error("Create sub admin error:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Failed to create sub admin" });
  }
};
