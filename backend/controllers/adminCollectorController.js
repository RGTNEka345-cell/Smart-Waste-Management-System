const db = require("../config/database");
const sendEmail = require("../utils/mailer");

/* ---------------- GET PENDING ---------------- */
exports.getPendingCollectors = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM Collectors WHERE status = 'PENDING'"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load collectors" });
  }
};

/* ---------------- APPROVE / REJECT ---------------- */
exports.approveOrRejectCollector = async (req, res) => {
  const {
    collector_id,
    approval_status,
    assigned_radius_km,
    remarks
  } = req.body;

  const admin_id = req.user?.admin_id || 1; // adjust after JWT

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    /* get collector */
    const [[collector]] = await conn.execute(
      "SELECT * FROM Collectors WHERE collector_id = ?",
      [collector_id]
    );

    if (!collector) {
      throw new Error("Collector not found");
    }

    /* insert approval record */
    await conn.execute(
      `INSERT INTO Collector_Approvals
       (collector_id, admin_id, approved_collection_type,
        assigned_radius_km, approval_status, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        collector_id,
        admin_id,
        collector.collection_type,
        assigned_radius_km,
        approval_status,
        remarks
      ]
    );

    if (approval_status === "APPROVED") {
      /* update collector status */
      await conn.execute(
        "UPDATE Collectors SET status = 'APPROVED' WHERE collector_id = ?",
        [collector_id]
      );

      /* send approval email */
      const approvalEmail = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0; text-align: center; }
            .header h2 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .info-box { background: #f0f7f4; padding: 15px; border-left: 4px solid #2e7d32; margin: 20px 0; border-radius: 4px; }
            .details { margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
            .label { font-weight: 600; color: #2e7d32; }
            .value { color: #555; }
            .cta-button { display: inline-block; background: #2e7d32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
            .success-badge { display: inline-block; background: #4caf50; color: white; padding: 8px 15px; border-radius: 20px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 Registration Approved!</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${collector.full_name}</strong>,</p>
              
              <div class="info-box">
                <p>Congratulations! Your collector registration has been <span class="success-badge">APPROVED</span></p>
                <p>You can now log in and access the WasteWise system to manage waste collection activities.</p>
              </div>

              <div class="details">
                <h3 style="color: #2e7d32;">Your Account Details:</h3>
                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value">${collector.email}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Collector Type:</span>
                  <span class="value">${collector.collection_type.toUpperCase()}</span>
                </div>
                ${assigned_radius_km ? `
                <div class="detail-row">
                  <span class="label">Assigned Service Radius:</span>
                  <span class="value">${assigned_radius_km} KM</span>
                </div>
                ` : ''}
              </div>

              <p style="text-align: center;">
                <a href="http://localhost:3000/collector/login" class="cta-button">Login to Dashboard</a>
              </p>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                If you have any questions, please contact our support team.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2026 WasteWise Smart Waste Management System. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail(
          collector.email,
          "✅ Your Collector Registration Has Been Approved - WasteWise",
          approvalEmail
        );
      } catch (emailErr) {
        console.warn("Email send failed (approval):", emailErr.message);
      }
    } else {
      await conn.execute(
        "UPDATE Collectors SET status = 'REJECTED' WHERE collector_id = ?",
        [collector_id]
      );

      /* send rejection email */
      const rejectionEmail = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #c62828 0%, #8e0000 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0; text-align: center; }
            .header h2 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .info-box { background: #fef5f5; padding: 15px; border-left: 4px solid #c62828; margin: 20px 0; border-radius: 4px; }
            .rejection-reason { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; border-radius: 4px; }
            .reason-label { font-weight: 600; color: #c62828; margin-bottom: 10px; }
            .reason-text { color: #555; margin: 10px 0; }
            .rejection-badge { display: inline-block; background: #c62828; color: white; padding: 8px 15px; border-radius: 20px; margin: 10px 0; }
            .next-steps { margin: 20px 0; }
            .step { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px; }
            .step-number { display: inline-block; background: #2e7d32; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 10px; font-weight: bold; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
            .support-link { color: #1976d2; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⚠️ Registration Status Update</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${collector.full_name}</strong>,</p>
              
              <div class="info-box">
                <p>We regret to inform you that your collector registration has been <span class="rejection-badge">REJECTED</span></p>
              </div>

              ${remarks ? `
              <div class="rejection-reason">
                <div class="reason-label">🔍 Reason for Rejection:</div>
                <div class="reason-text">${remarks}</div>
              </div>
              ` : ''}

              <div class="next-steps">
                <h3 style="color: #2e7d32;">What Can You Do Next?</h3>
                <div class="step">
                  <span class="step-number">1</span>
                  Review the rejection reason provided above carefully.
                </div>
                <div class="step">
                  <span class="step-number">2</span>
                  Gather the required documents and correct information.
                </div>
                <div class="step">
                  <span class="step-number">3</span>
                  Re-register on the WasteWise platform with complete and accurate details.
                </div>
              </div>

              <p style="margin-top: 30px;">
                If you believe this decision is incorrect or need clarification, please <a href="mailto:support@wastewise.com" class="support-link">contact our support team</a>.
              </p>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                We appreciate your interest in WasteWise and welcome you to reapply with the necessary corrections.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2026 WasteWise Smart Waste Management System. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail(
          collector.email,
          "❌ Your Collector Registration Has Been Rejected - WasteWise",
          rejectionEmail
        );
      } catch (emailErr) {
        console.warn("Email send failed (rejection):", emailErr.message);
      }
    }

    await conn.commit();
    res.json({ message: `Collector ${approval_status}` });
  } catch (err) {
    await conn.rollback();
    console.error("Approval Error:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ message: err.message || "Approval action failed" });
  } finally {
    conn.release();
  }
};

/* ---------------- GET APPROVAL HISTORY ---------------- */
exports.getApprovalHistory = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ca.approval_id,
        ca.collector_id,
        ca.admin_id,
        ca.approval_status,
        ca.approved_collection_type,
        ca.assigned_radius_km,
        ca.remarks,
        ca.approved_at,
        c.full_name,
        c.email,
        c.phone_number,
        c.collection_type,
        c.vehicle_number,
        c.vehicle_photo,
        c.home_address,
        c.latitude,
        c.longitude,
        c.gender,
        a.fullname as admin_name
      FROM Collector_Approvals ca
      JOIN Collectors c ON ca.collector_id = c.collector_id
      LEFT JOIN Admins a ON ca.admin_id = a.admin_id
      WHERE ca.approval_status = 'APPROVED'
      ORDER BY ca.approved_at DESC
    `);
    
    res.json(rows);
  } catch (err) {
    console.error("Get Approval History Error:", err.message);
    res.status(500).json({ message: "Failed to load approval history" });
  }
};

/* ---------------- GET REJECTION HISTORY ---------------- */
exports.getRejectionHistory = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ca.approval_id,
        ca.collector_id,
        ca.admin_id,
        ca.approval_status,
        ca.approved_collection_type,
        ca.remarks,
        ca.approved_at,
        c.full_name,
        c.email,
        c.phone_number,
        c.collection_type,
        c.vehicle_number,
        c.vehicle_photo,
        c.home_address,
        c.latitude,
        c.longitude,
        c.gender,
        a.fullname as admin_name
      FROM Collector_Approvals ca
      JOIN Collectors c ON ca.collector_id = c.collector_id
      LEFT JOIN Admins a ON ca.admin_id = a.admin_id
      WHERE ca.approval_status = 'REJECTED'
      ORDER BY ca.approved_at DESC
    `);
    
    res.json(rows);
  } catch (err) {
    console.error("Get Rejection History Error:", err.message);
    res.status(500).json({ message: "Failed to load rejection history" });
  }
};
