const db = require("../config/database");

const Citizen = {

  // CREATE
  create: async (data) => {
    const sql = `
      INSERT INTO citizens
      (full_name, email, phone, password, address, date_of_birth, gender, latitude, longitude, photo_url, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
    `;

    return db.execute(sql, [
      data.full_name,
      data.email,
      data.phone,
      data.password,
      data.address,
      data.date_of_birth,
      data.gender,
      data.latitude,
      data.longitude,
      data.photo_url || null
    ]);
  },

  // FIND BY EMAIL (LOGIN / FORGOT PASSWORD)
  findByEmail: async (email) => {
    const [rows] = await db.execute(
      "SELECT * FROM citizens WHERE email = ?",
      [email]
    );
    return rows[0] || null;
  },

  // FIND BY ID
  findById: async (id) => {
    const [rows] = await db.execute(
      "SELECT * FROM citizens WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },

  // OTP FUNCTIONS
  updateOTP: async (email, otpCode, expiresAt) => {
    return db.execute(
      "UPDATE citizens SET otp_code = ?, otp_expires_at = ? WHERE email = ?",
      [otpCode, expiresAt, email]
    );
  },

  verifyOTP: async (email, otpCode) => {
    const [rows] = await db.execute(
      `SELECT * FROM citizens
       WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW()`,
      [email, otpCode]
    );

    if (rows.length === 0) return false;

    await db.execute(
      `UPDATE citizens
       SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL
       WHERE email = ?`,
      [email]
    );

    return true;
  },

  resendOTP: async (email, otpCode, expiresAt) => {
    return db.execute(
      "UPDATE citizens SET otp_code = ?, otp_expires_at = ? WHERE email = ?",
      [otpCode, expiresAt, email]
    );
  },

  updatePassword: async (email, hashedPassword) => {
    return db.execute(
      "UPDATE citizens SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );
  },

  verifyOTPForReset: async (email, otpCode) => {
    const [rows] = await db.execute(
      `SELECT * FROM citizens
       WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW()`,
      [email, otpCode]
    );
    return rows.length > 0;
  },

  clearOTPAfterReset: async (email) => {
    return db.execute(
      "UPDATE citizens SET otp_code = NULL, otp_expires_at = NULL WHERE email = ?",
      [email]
    );
  },

  // 🔹 PROFILE UPDATE
  updateById: async (id, data) => {
    const {
      full_name,
      phone,
      address,
      date_of_birth,
      gender,
      latitude,
      longitude,
      photo_url,
      email
    } = data;

    await db.execute(
      `UPDATE citizens SET
        full_name = ?, phone = ?, address = ?, date_of_birth = ?,
        gender = ?, latitude = ?, longitude = ?, photo_url = ?, email = ?
       WHERE id = ?`,
      [
        full_name,
        phone,
        address,
        date_of_birth,
        gender,
        latitude,
        longitude,
        photo_url,
        email,
        id
      ]
    );

    const [rows] = await db.execute(
      "SELECT * FROM citizens WHERE id = ?",
      [id]
    );

    return rows[0];
  }
};

module.exports = Citizen;
