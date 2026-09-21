import express from "express";
import cors from "cors";
import sessionRoutes from "./routes/sessionRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "SafeLink API is running",
  });
});

app.use("/session", sessionRoutes);

export default app;
