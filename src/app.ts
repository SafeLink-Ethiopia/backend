import express from "express";
import cors from "cors";

import sessionRoutes from "./routes/sessionRoutes";
import adminRoutes from "./routes/adminRoutes";
import awarenessPostRoutes from "./routes/awarenessPostRoutes";

import servicesRouter from "./routes/services";
import conversationsRouter from "./routes/conversations";
import advisorRoutes from "./routes/advisorRoutes";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SafeLink backend is running",
  });
});

app.use("/api/services", servicesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/session", sessionRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/admin/awareness-posts", awarenessPostRoutes);
app.use("/api/advisors", advisorRoutes);

export default app;
