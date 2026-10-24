
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const preparationRoutes = require("./routes/preparation.routes");
const resumeRoutes = require("./routes/resume.routes");
const preparationPlanRoutes = require("./routes/preparationPlan.routes")
const interviewPracticeRoutes = require("./routes/interviewPractice.routes");
const mockInterviewRoutes = require("./routes/mockInterview.routes");
const profileRoutes = require("./routes/profile.routes");

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PrepPilot API is running.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/preparations", preparationRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/preparation-plans", preparationPlanRoutes);
app.use("/api/interview-practice", interviewPracticeRoutes);
app.use("/api/mock-interviews", mockInterviewRoutes);
app.use("/api/profile", profileRoutes);

module.exports = app;
