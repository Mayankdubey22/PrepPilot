
const express = require("express");

const {
  generateMyPreparationPlan,
  getMyPreparationPlan,
} = require("../controllers/preparationPlan.controller");

const {
  updateTaskCompletion,
} = require("../controllers/preparationTask.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

// Generate and save a personalized AI plan
router.post(
  "/:preparationId/generate",
  protect,
  generateMyPreparationPlan
);

// Retrieve a saved AI plan
router.get(
  "/:preparationId",
  protect,
  getMyPreparationPlan
);

// Update completion status for a specific task
router.patch(
  "/:preparationId/days/:dayId/tasks/:taskId",
  protect,
  updateTaskCompletion
);

module.exports = router;
