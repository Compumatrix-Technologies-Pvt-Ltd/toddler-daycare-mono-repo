import http from "http";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { initSocket } from "./config/socket";

dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  connectDB();
  console.log(`[backend] Express REST + Socket.IO server running on port ${PORT}`);
  console.log(`[backend] Local:   http://localhost:${PORT}`);
  console.log(`[backend] Health:  http://localhost:${PORT}/api/health`);
});

