const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  // Use Ethereal for testing
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "colleen.bosco@ethereal.email",
      pass: "sT8sW1SeJH9R9q49Mt"
    }
  });
};

const transporter = createTransporter();

class EmailService {
  // Send OTP email for login
  static async sendOTP(email, otpCode, collectorName = null) {
    const mailOptions = {
      from: process.env.EMAIL_USER || '"EcoWaste" <noreply@ecowaste.com>',
      to: email,
      subject: "Collector Login OTP - EcoWaste System",
      html: this.generateOTPEmail(otpCode, collectorName, "login")
    };

    return this.sendEmail(mailOptions, otpCode);
  }

  // Send OTP for password reset
  static async sendPasswordResetOTP(email, otpCode, collectorName = null) {
    const mailOptions = {
      from: process.env.EMAIL_USER || '"EcoWaste" <noreply@ecowaste.com>',
      to: email,
      subject: "Password Reset OTP - EcoWaste Collector",
      html: this.generateOTPEmail(otpCode, collectorName, "password_reset")
    };

    return this.sendEmail(mailOptions, otpCode);
  }

  // Send password reset confirmation
  static async sendPasswordResetConfirmation(email, collectorName = null) {
    const mailOptions = {
      from: process.env.EMAIL_USER || '"EcoWaste" <noreply@ecowaste.com>',
      to: email,
      subject: "Password Reset Successful - EcoWaste Collector",
      html: this.generatePasswordResetConfirmationEmail(collectorName)
    };

    return this.sendEmail(mailOptions);
  }

  // Send password change notification
  static async sendPasswordChangeNotification(email, collectorName = null) {
    const mailOptions = {
      from: process.env.EMAIL_USER || '"EcoWaste" <noreply@ecowaste.com>',
      to: email,
      subject: "Password Changed - EcoWaste Collector",
      html: this.generatePasswordChangeEmail(collectorName)
    };

    return this.sendEmail(mailOptions);
  }

  // Generic email sending method
  static async sendEmail(mailOptions, otpCode = null) {
    try {
      const info = await transporter.sendMail(mailOptions);
      
      if (info.messageId && !process.env.EMAIL_USER) {
        console.log("📧 Email sent! Preview URL:", nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId, devMode: false };
    } catch (error) {
      console.error("Email sending failed:", error);
      
      // For development, simulate success
      console.log(`📧 [DEV MODE] Email to ${mailOptions.to}:`, {
        subject: mailOptions.subject,
        otp: otpCode || 'N/A'
      });
      
      return { success: true, devMode: true, otp: otpCode };
    }
  }

  // Generate OTP email HTML
  static generateOTPEmail(otpCode, collectorName = null, type = "login") {
    const greeting = collectorName 
      ? `Hello ${collectorName},` 
      : "Hello,";
    
    const purpose = type === "password_reset" 
      ? "to reset your password" 
      : "for collector login";
    
    const title = type === "password_reset" 
      ? "Password Reset OTP" 
      : "Login OTP";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; padding: 25px; text-align: center; margin: 25px 0; 
                     border-radius: 10px; border: 2px dashed #667eea; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; 
                      color: #e74c3c; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { color: #e74c3c; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; 
                    color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EcoWaste Collector - ${title}</h1>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <p>Your One-Time Password (OTP) ${purpose} is:</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #555;">Enter this code:</p>
              <div class="otp-code">${otpCode}</div>
              <p style="margin: 10px 0 0 0; color: #777;">(Valid for ${type === "password_reset" ? "15" : "10"} minutes)</p>
            </div>
            
            <p class="warning">⚠️ Do not share this OTP with anyone.</p>
            <p>If you didn't request this OTP, please ignore this email and secure your account.</p>
            
            <p>Best regards,<br>EcoWaste Management Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EcoWaste System. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate password reset confirmation email
  static generatePasswordResetConfirmationEmail(collectorName = null) {
    const greeting = collectorName 
      ? `Hello ${collectorName},` 
      : "Hello,";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #c6f6d5; padding: 20px; border-radius: 8px; margin: 20px 0; 
                        border-left: 4px solid #38a169; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #48bb78; 
                    color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Successful</h1>
          </div>
          <div class="content">
            <p>${greeting}</p>
            
            <div class="success-box">
              <p style="margin: 0; font-size: 18px; color: #22543d;">
                ✅ Your password has been successfully reset!
              </p>
            </div>
            
            <p>You can now login to your EcoWaste Collector account using your new password.</p>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/collector/login" 
                 class="button">Go to Login</a>
            </p>
            
            <p class="warning">⚠️ If you did not reset your password, please contact support immediately.</p>
            
            <p>Best regards,<br>EcoWaste Security Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EcoWaste System. All rights reserved.</p>
            <p>This is an automated security message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate password change email
  static generatePasswordChangeEmail(collectorName = null) {
    const greeting = collectorName 
      ? `Hello ${collectorName},` 
      : "Hello,";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #ebf8ff; padding: 20px; border-radius: 8px; margin: 20px 0; 
                     border-left: 4px solid #4299e1; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed</h1>
          </div>
          <div class="content">
            <p>${greeting}</p>
            
            <div class="info-box">
              <p style="margin: 0; font-size: 16px; color: #2c5282;">
                Your EcoWaste Collector account password was recently changed.
              </p>
            </div>
            
            <p><strong>Details:</strong></p>
            <ul>
              <li>Time: ${new Date().toLocaleString()}</li>
              <li>Account: Collector Account</li>
              <li>Action: Password Change</li>
            </ul>
            
            <p class="warning">⚠️ If you did not make this change, please:</p>
            <ol>
              <li>Reset your password immediately</li>
              <li>Contact our support team</li>
              <li>Review your account security</li>
            </ol>
            
            <p>Best regards,<br>EcoWaste Security Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EcoWaste System. All rights reserved.</p>
            <p>This is an automated security notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Test email connection
  static async testConnection() {
    try {
      await transporter.verify();
      console.log("✅ Email server connection verified");
      return true;
    } catch (error) {
      console.warn("⚠️ Email server connection failed. Using dev mode.");
      return false;
    }
  }
}

// Test connection on startup
EmailService.testConnection();

module.exports = EmailService;