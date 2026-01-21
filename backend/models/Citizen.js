// models/Citizen.js
const db = require("../config/database");

exports.create = async (data) => {
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
};

exports.findByEmail = async (email) => {
  const [rows] = await db.execute(
    "SELECT * FROM citizens WHERE email = ?",
    [email]
  );
  return rows[0] || null; // ✅ VERY IMPORTANT
};

exports.findById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM citizens WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

exports.updateOTP = async (email, otpCode, expiresAt) => {
  return db.execute(
    "UPDATE citizens SET otp_code = ?, otp_expires_at = ? WHERE email = ?",
    [otpCode, expiresAt, email]
  );
};

exports.verifyOTP = async (email, otpCode) => {
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
};

exports.resendOTP = async (email, otpCode, expiresAt) => {
  return db.execute(
    "UPDATE citizens SET otp_code = ?, otp_expires_at = ? WHERE email = ?",
    [otpCode, expiresAt, email]
  );
};

exports.updatePassword = async (email, hashedPassword) => {
  return db.execute(
    "UPDATE citizens SET password = ? WHERE email = ?",
    [hashedPassword, email]
  );
};

exports.verifyOTPForReset = async (email, otpCode) => {
  const [rows] = await db.execute(
    `SELECT * FROM citizens
     WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW()`,
    [email, otpCode]
  );

  if (rows.length === 0) return false;
  return true;
};

exports.clearOTPAfterReset = async (email) => {
  return db.execute(
    "UPDATE citizens SET otp_code = NULL, otp_expires_at = NULL WHERE email = ?",
    [email]
  );
};


// Additional methods for profile update
const Citizen = {
  findById: async (id) => {
    const [rows] = await db.query("SELECT * FROM citizens WHERE id = ?", [id]);
    return rows[0];
  },

  updateById: async (id, data) => {
    const { full_name, phone, address, date_of_birth, gender, latitude, longitude, photo_url, email } = data;
    await db.query(
      `UPDATE citizens SET
        full_name = ?, 
        phone = ?, 
        address = ?, 
        date_of_birth = ?, 
        gender = ?, 
        latitude = ?, 
        longitude = ?, 
        photo_url = ?, 
        email = ?
      WHERE id = ?`,
      [full_name, phone, address, date_of_birth, gender, latitude, longitude, photo_url, email, id]
    );
    const [updated] = await db.query("SELECT * FROM citizens WHERE id = ?", [id]);
    return updated[0];
  }
};

module.exports = Citizen;


