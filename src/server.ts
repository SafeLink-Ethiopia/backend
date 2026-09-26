import dotenv from "dotenv";
import dns from "node:dns";

import app from "./app";
import connectDB from "./config/db";

dotenv.config();

// Force DNS resolution through Google DNS
dns.setServers(["8.8.8.8"]);

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`SafeLink server running on port ${PORT}`);
  });
};

startServer();