import express from "express";
import cors from "cors";

import sessionRoutes from "./routes/sessionRoutes";
import adminRoutes from "./routes/adminRoutes";
import awarenessPostRoutes from "./routes/awarenessPostRoutes";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "SafeLink API is running",
  });
});

app.use("/session", sessionRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/admin/awareness-posts", awarenessPostRoutes);

export default app;
