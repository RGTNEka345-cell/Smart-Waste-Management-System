// server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

/* ---------------- BASIC MIDDLEWARE ---------------- */
app.use(cors());

// Request logger
app.use((req, res, next) => {
  console.log(
    "REQ",
    req.method,
    req.path,
    "Content-Type:",
    req.headers["content-type"]
  );
  next();
});

app.use(express.json());

/* ---------------- STATIC UPLOADS ---------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------------- HEALTH CHECK ---------------- */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* ---------------- DB CONNECTIVITY CHECK ---------------- */
try {
  const db = require("./config/database");
  db.execute("SELECT 1")
    .then(() => console.log("DB connectivity OK"))
    .catch((err) =>
      console.error("DB connectivity error:", err.message)
    );
} catch (err) {
  console.error("Failed to require DB module:", err.message);
}

/* ---------------- API ROUTES ---------------- */
app.use("/api", require("./routes/citizenRoutes"));
app.use("/api", require("./routes/adminRoutes"));
app.use("/api", require("./routes/collectorRoutes")); // ✅ NEW
app.use("/api", require("./routes/pickupRequestRoutes"));
app.use("/api", require("./routes/notificationRoutes"));

/* ---------------- GLOBAL ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.message || err);

  // Multer image validation error
  if (err?.message?.startsWith("Only image files")) {
    return res.status(400).json({ message: err.message });
  }

  // Multer size limit error
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File size exceeds limit (5MB)"
    });
  }

  res.status(500).json({ message: "Server error" });
});

/* ---------------- EXPORT APP ---------------- */
module.exports = app;
