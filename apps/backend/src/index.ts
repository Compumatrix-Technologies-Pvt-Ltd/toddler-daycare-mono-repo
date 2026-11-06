import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[backend] Express REST server running on port ${PORT}`);
  console.log(`[backend] Local:   http://localhost:${PORT}`);
  console.log(`[backend] Health:  http://localhost:${PORT}/api/health`);
});

