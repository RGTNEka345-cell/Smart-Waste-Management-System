require("dotenv").config();
const http = require("http");
const app = require("./server");
const { initSocket } = require("./utils/socket");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
