// Simple in-memory session storage
// In production, use Redis or Database

const sessions = new Map(); // token -> sessionData

class SessionManager {
  // Create new session
  static createSession(token, sessionData) {
    sessions.set(token, {
      ...sessionData,
      createdAt: Date.now()
    });
    
    // Cleanup old sessions periodically
    this.cleanup();
    
    return true;
  }

  // Get session
  static getSession(token) {
    const session = sessions.get(token);
    
    if (!session) {
      return null;
    }

    // Check if session expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }

    return session;
  }

  // Delete session
  static deleteSession(token) {
    return sessions.delete(token);
  }

  // Cleanup expired sessions
  static cleanup() {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
      if (session.expiresAt && now > session.expiresAt) {
        sessions.delete(token);
      }
    }
  }
}

// Cleanup every hour
setInterval(() => {
  SessionManager.cleanup();
}, 60 * 60 * 1000);

module.exports = SessionManager;