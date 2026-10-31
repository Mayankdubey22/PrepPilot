require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/db.config");
const { evaluateSubmittedInterview } = require("./controllers/mockInterview.controller");
const {
  startInterviewEvaluationWorker,
} = require("./services/interviewEvaluationQueue.service");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    startInterviewEvaluationWorker(evaluateSubmittedInterview);

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();
