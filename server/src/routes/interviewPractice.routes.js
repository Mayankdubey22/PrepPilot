
const express = require("express");

const {
  getInterviewPractice,
  createInterviewPractice,
  saveInterviewAnswer,
  evaluateAnswer,
  getInterviewPracticeStats,
} = require("../controllers/interviewPractice.controller");

const protect = require("../middleware/auth.middleware");
const { createRateLimiter, userIdentity } = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.use(protect);

router.get("/stats", getInterviewPracticeStats);
router.get("/:preparationId", getInterviewPractice);
router.post(
  "/:preparationId/generate",
  createRateLimiter({
    scope: "interview-practice-generation",
    limit: 3,
    windowMs: 60 * 60 * 1000,
    identity: userIdentity,
  }),
  createInterviewPractice
);
router.patch("/:preparationId/questions/:questionId", saveInterviewAnswer);
router.post(
  "/:preparationId/questions/:questionId/evaluate",
  createRateLimiter({
    scope: "interview-answer-evaluation",
    limit: 30,
    windowMs: 60 * 60 * 1000,
    identity: userIdentity,
  }),
  evaluateAnswer
);

module.exports = router;
