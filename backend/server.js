
// citizen registeration and otp verification server
const path = require("path");
// Load .env from backend root (and fallback) so DB env vars are available
require("dotenv").config({ path: path.join(__dirname, ".env" ) });
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log('REQ', req.method, req.path, 'Content-Type:', req.headers['content-type']);
  next();
});
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health-check
app.get('/health', (req, res) => res.json({ ok: true }));

// Quick DB connectivity check on startup
try {
  const db = require('./config/database');
  db.execute('SELECT 1').then(() => console.log('DB connectivity OK')).catch(err => console.error('DB connectivity error:', err.message));
} catch (err) {
  console.error('Failed to require DB module:', err.message);
}

// mount api routes at /api
app.use("/api", require("./routes/citizenRoutes"));
// Mount auth routes

// Mount admin routes
app.use("/api", require("./routes/adminRoutes"));


// Global error handler (handle multer and other errors gracefully)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.message ? err.message : err);
  if (err && err.message && err.message.startsWith('Only image files')) {
    return res.status(400).json({ message: err.message });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size exceeds limit (5MB)' });
  }
  res.status(500).json({ message: 'Server error' });
});

// End of server definition

// Export the Express app so the main `index.js` can start the server
module.exports = app;
