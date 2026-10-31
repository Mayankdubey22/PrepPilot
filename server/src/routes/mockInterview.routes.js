
const express = require("express");

const {
  getMockInterview,
  prepareMockInterviewQuestions,
  startMockInterview,
  saveMockAnswer,
  toggleQuestionReview,
  terminateMockInterview,
  completeMockInterview,
  getMockInterviewReport,
} = require("../controllers/mockInterview.controller");

const protect = require("../middleware/auth.middleware");
const { createRateLimiter, userIdentity } = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.use(protect);

router.get("/:preparationId", getMockInterview);

router.post(
  "/:preparationId/questions/prepare",
  createRateLimiter({
    scope: "mock-question-generation",
    limit: 6,
    windowMs: 60 * 60 * 1000,
    identity: userIdentity,
  }),
  prepareMockInterviewQuestions
);

router.post("/:preparationId/start", startMockInterview);

router.patch(
  "/:interviewId/questions/:questionId",
  saveMockAnswer
);

router.patch(
  "/:interviewId/questions/:questionId/review",
  toggleQuestionReview
);

router.post("/:interviewId/terminate", terminateMockInterview);

router.post("/:interviewId/complete", completeMockInterview);

router.get(
  "/:preparationId/report/:interviewId",
  getMockInterviewReport
);

module.exports = router;
