// middleware/citizenAuth.js - Fixed version
const jwt = require('jsonwebtoken');

exports.citizenAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    console.log("🔑 Auth Header received:", authHeader ? "Present" : "Missing");
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No token provided." 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log("🔑 Token extracted (first 20 chars):", token.substring(0, 20) + "...");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wastewise-secret-key-123');
    console.log("🔑 Token decoded:", {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    });

    // Check if user is a citizen
    if (decoded.role !== 'citizen') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Invalid user role." 
      });
    }

    // Add user info to request
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    
    console.log("✅ Authentication successful for user:", decoded.email);
    next();
    
  } catch (error) {
    console.error("🔥 Auth Middleware Error:", error.name, error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Session expired. Please login again." 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token." 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed." 
    });
  }
};