const db = require("../config/database");

const normalizeLogoPath = (pathValue) => {
  if (!pathValue) return null;
  const value = String(pathValue).trim();
  if (!value) return null;
  return value.startsWith("/") ? value : `/${value}`;
};

exports.getSiteLogo = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT site_logo, updated_at
       FROM website_settings
       ORDER BY updated_at DESC, setting_id DESC
       LIMIT 1`
    );

    if (!rows.length) {
      return res.json({ logo: null });
    }

    return res.json({
      logo: normalizeLogoPath(rows[0].site_logo),
      updated_at: rows[0].updated_at
    });
  } catch (err) {
    console.error("Get site logo error:", err.message);
    return res.status(500).json({ message: "Failed to load site logo" });
  }
};

exports.updateSiteLogo = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!req.file) {
      return res.status(400).json({ message: "Logo file is required" });
    }

    const logoPath = `/uploads/site/${req.file.filename}`;
    await db.execute(
      `INSERT INTO website_settings (site_logo, updated_by_admin)
       VALUES (?, ?)`,
      [logoPath, adminId]
    );

    return res.json({
      success: true,
      message: "Logo updated successfully",
      logo: logoPath
    });
  } catch (err) {
    console.error("Update site logo error:", err.message);
    return res.status(500).json({ message: "Failed to update site logo" });
  }
};
