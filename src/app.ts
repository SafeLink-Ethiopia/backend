import express from "express";
import cors from "cors";

import servicesRouter from "./routes/services";
import conversationsRouter from "./routes/conversations";

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

export default app;