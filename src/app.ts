
import express from "express";
import cors from "cors";

import sessionRoutes from "./routes/sessionRoutes";
import adminRoutes from "./routes/adminRoutes";
import awarenessPostRoutes from "./routes/awarenessPostRoutes";
import servicesRouter from "./routes/services";
import conversationsRouter from "./routes/conversations";
import advisorRoutes from "./routes/advisorRoutes";
import adminDashboardRoutes from "./routes/adminDashboard";
import adminAdvisorConversationRoutes from "./routes/adminAdvisorConversationRoutes";
import advisorDashboardRoutes from "./routes/Advisordashboardroutes";
import facilitiesRouter from "./routes/facilities";
import advisorConversationRoutes from "./routes/advisorConversationRoutes";
import advisorAdminConversationRoutes from "./routes/advisorAdminConversationRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SafeLink backend is running",
  });
});

// =========================
// General APIs
// =========================

app.use("/api/services", servicesRouter);
app.use("/api/conversations", conversationsRouter);

// =========================
// Session APIs
// =========================

app.use("/session", sessionRoutes);

// =========================
// Facilities APIs
// =========================

app.use("/api/facilities", facilitiesRouter);

// =========================
// Advisor APIs
// =========================

app.use("/api/advisor", advisorRoutes);
app.use("/api/advisors", advisorRoutes);

// =========================
// Admin APIs
// =========================

app.use("/api/admin", adminRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/awareness-posts", awarenessPostRoutes);
app.use("/api/admin-advisor-conversations", adminAdvisorConversationRoutes);

// =========================
// Advisor Portal APIs
// =========================

app.use("/api/advisor-portal", advisorDashboardRoutes);
app.use("/api/advisor-conversations", advisorConversationRoutes);
app.use("/api/advisor-admin-conversations", advisorAdminConversationRoutes);

export default app;

