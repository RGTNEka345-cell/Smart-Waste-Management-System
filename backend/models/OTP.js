const db = require("../config/database");

const OTP = {
  // Create new OTP
  createOTP: async (email, otpCode, collectorId = null) => {
    const sql = `
      INSERT INTO OTPs (email, otp_code, collector_id, expires_at)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `;
    await db.execute(sql, [email, otpCode, collectorId]);
  },

  // Verify OTP
  verifyOTP: async (email, otpCode) => {
    const sql = `
      SELECT * FROM OTPs 
      WHERE email = ? AND otp_code = ? 
      AND expires_at > NOW() AND is_used = 0
    `;
    const [rows] = await db.execute(sql, [email, otpCode]);
    return rows[0] || null;
  },

  // Mark OTP as used
  markUsed: async (otpId) => {
    await db.execute(
      "UPDATE OTPs SET is_used = 1 WHERE id = ?",
      [otpId]
    );
  },

  // Delete expired OTPs
  cleanup: async () => {
    await db.execute(
      "DELETE FROM OTPs WHERE expires_at < NOW() OR is_used = 1"
    );
  }
};

module.exports = OTP;