
const express = require("express");

const {
  getInterviewPractice,
  createInterviewPractice,
  saveInterviewAnswer,
  evaluateAnswer,
  getInterviewPracticeStats,
} = require("../controllers/interviewPractice.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/stats", getInterviewPracticeStats);
router.get("/:preparationId", getInterviewPractice);
router.post("/:preparationId/generate", createInterviewPractice);
router.patch("/:preparationId/questions/:questionId", saveInterviewAnswer);
router.post("/:preparationId/questions/:questionId/evaluate", evaluateAnswer);

module.exports = router;
