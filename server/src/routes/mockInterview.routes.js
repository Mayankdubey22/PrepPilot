
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

const router = express.Router();

router.use(protect);

router.get("/:preparationId", getMockInterview);

router.post(
  "/:preparationId/questions/prepare",
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
