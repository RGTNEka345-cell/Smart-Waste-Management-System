// In-memory OTP storage
const otpStore = new Map(); // email -> {otp, type, expiresAt, collectorId, purpose}
const PASSWORD_RESET_PREFIX = "PASS_RESET_";

class OTPManager {
  // Generate 6-digit OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create OTP for login
  static createOTP(email, collectorId = null) {
    const otp = this.generateOTP();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    otpStore.set(email, {
      otp,
      type: 'login',
      expiresAt,
      collectorId,
      createdAt: Date.now()
    });

    this.cleanup();
    
    return otp;
  }

  // Create OTP for password reset
  static createPasswordResetOTP(email, collectorId = null) {
    const otp = this.generateOTP();
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes for password reset
    
    otpStore.set(PASSWORD_RESET_PREFIX + email, {
      otp,
      type: 'password_reset',
      expiresAt,
      collectorId,
      createdAt: Date.now()
    });

    this.cleanup();
    
    return otp;
  }

  // Verify OTP for login
  static verifyOTP(email, otp) {
    const record = otpStore.get(email);
    
    if (!record || record.type !== 'login') {
      return { valid: false, message: "OTP not found or expired" };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return { valid: false, message: "OTP expired" };
    }

    if (record.otp !== otp) {
      return { valid: false, message: "Invalid OTP" };
    }

    const collectorId = record.collectorId;
    otpStore.delete(email);
    
    return {
      valid: true,
      message: "OTP verified successfully",
      collectorId
    };
  }

  // Verify OTP for password reset
  static verifyPasswordResetOTP(email, otp) {
    const key = PASSWORD_RESET_PREFIX + email;
    const record = otpStore.get(key);
    
    if (!record || record.type !== 'password_reset') {
      return { valid: false, message: "Password reset OTP not found or expired" };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return { valid: false, message: "Password reset OTP expired" };
    }

    if (record.otp !== otp) {
      return { valid: false, message: "Invalid OTP" };
    }

    return {
      valid: true,
      message: "Password reset OTP verified successfully",
      collectorId: record.collectorId
    };
  }

  // Delete OTP
  static deleteOTP(email) {
    // Delete both login and password reset OTPs
    otpStore.delete(email);
    otpStore.delete(PASSWORD_RESET_PREFIX + email);
  }

  // Check if OTP exists
  static hasOTP(email) {
    const record = otpStore.get(email);
    return record && Date.now() < record.expiresAt;
  }

  // Get OTP info
  static getOTPInfo(email) {
    return otpStore.get(email);
  }

  // Cleanup expired OTPs
  static cleanup() {
    const now = Date.now();
    for (const [key, record] of otpStore.entries()) {
      if (now > record.expiresAt) {
        otpStore.delete(key);
      }
    }
  }
}

// Cleanup every 5 minutes
setInterval(() => {
  OTPManager.cleanup();
}, 5 * 60 * 1000);

module.exports = OTPManager;