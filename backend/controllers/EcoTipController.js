const db = require("../config/database");

const VALID_CATEGORIES = new Set([
  "recycle",
  "reduce",
  "reuse",
  "compost",
  "energy",
  "water",
  "plastic",
  "general"
]);

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const VALID_AUDIENCE = new Set(["CITIZEN", "COLLECTOR", "BOTH"]);

exports.createEcoTip = async (req, res) => {
  try {
    const adminId = req.adminId;
    const {
      title,
      content,
      category = "general",
      difficulty = "easy",
      audience = "BOTH",
      is_published = "1",
      source_url = null
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }
    if (!VALID_CATEGORIES.has(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (!VALID_DIFFICULTIES.has(difficulty)) {
      return res.status(400).json({ message: "Invalid difficulty" });
    }
    if (!VALID_AUDIENCE.has(audience)) {
      return res.status(400).json({ message: "Invalid audience" });
    }

    const image_url = req.file ? `/uploads/eco_tips/${req.file.filename}` : null;
    const published =
      is_published === true ||
      is_published === 1 ||
      is_published === "1" ||
      is_published === "true";

    const [result] = await db.execute(
      `INSERT INTO eco_tips
       (title, content, category, difficulty, audience, image_url, source_url, is_published, created_by_admin_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        content.trim(),
        category,
        difficulty,
        audience,
        image_url,
        source_url || null,
        published ? 1 : 0,
        adminId
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Eco tip created successfully",
      tip_id: result.insertId
    });
  } catch (err) {
    console.error("Create eco tip error:", err.message);
    return res.status(500).json({ message: "Failed to create eco tip" });
  }
};

exports.listEcoTips = async (req, res) => {
  try {
    const audience = String(req.query?.audience || "BOTH").toUpperCase();
    const category = req.query?.category ? String(req.query.category).toLowerCase() : "";
    const difficulty = req.query?.difficulty ? String(req.query.difficulty).toLowerCase() : "";

    if (!VALID_AUDIENCE.has(audience)) {
      return res.status(400).json({ message: "Invalid audience" });
    }

    const where = [
      "is_published = 1",
      "(audience = 'BOTH' OR audience = ?)"
    ];
    const params = [audience];

    if (category) {
      if (!VALID_CATEGORIES.has(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      where.push("category = ?");
      params.push(category);
    }

    if (difficulty) {
      if (!VALID_DIFFICULTIES.has(difficulty)) {
        return res.status(400).json({ message: "Invalid difficulty" });
      }
      where.push("difficulty = ?");
      params.push(difficulty);
    }

    const [rows] = await db.execute(
      `SELECT tip_id, title, content, category, difficulty, audience, image_url, source_url, is_published, created_at, updated_at
       FROM eco_tips
       WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC`,
      params
    );

    return res.json(rows);
  } catch (err) {
    console.error("List eco tips error:", err.message);
    return res.status(500).json({ message: "Failed to load eco tips" });
  }
};
