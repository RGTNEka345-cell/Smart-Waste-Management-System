let io = null;

const userRoom = (role, id) => `user:${String(role).toUpperCase()}:${id}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;

const initSocket = (server) => {
  const { Server } = require("socket.io");
  const { resolveActor } = require("./messageAuth");

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST", "PATCH"]
    }
  });

  io.use((socket, next) => {
    const headers = {};
    const auth = socket.handshake.auth || {};
    if (auth.token) headers.authorization = `Bearer ${auth.token}`;
    if (auth.role) headers["x-user-role"] = auth.role;
    if (auth.userId) headers["x-user-id"] = auth.userId;

    const actor = resolveActor({ headers });
    if (!actor) return next(new Error("Unauthorized"));

    socket.actor = actor;
    return next();
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.actor.role, socket.actor.id));

    socket.on("join_conversation", (conversationId) => {
      const numeric = parseInt(conversationId, 10);
      if (Number.isInteger(numeric)) socket.join(conversationRoom(numeric));
    });

    socket.on("leave_conversation", (conversationId) => {
      const numeric = parseInt(conversationId, 10);
      if (Number.isInteger(numeric)) socket.leave(conversationRoom(numeric));
    });
  });

  return io;
};

const getIo = () => io;

module.exports = {
  conversationRoom,
  getIo,
  initSocket,
  userRoom
};
