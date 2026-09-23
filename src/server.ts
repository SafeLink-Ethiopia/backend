import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/db";
import awarenessRoutes from "./routes/awarenessRoutes";
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();
  app.use("/api/awareness", awarenessRoutes);

  app.listen(PORT, () => {
    console.log(`SafeLink server running on port ${PORT}`);
  });
};

startServer();
