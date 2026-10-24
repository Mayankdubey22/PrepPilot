
const mongoose = require("mongoose");

const PreparationPlan = require("../models/preparationPlan.model");
const Preparation = require("../models/preparation.model");

const {
  queueQuestionSetGeneration,
} = require("../services/mockInterviewQuestionSet.service");

const updateTaskCompletion = async (req, res) => {
  try {
    const { preparationId, dayId, taskId } = req.params;
    const { isCompleted } = req.body;
    const userId = req.userId;

    if (
      !mongoose.isValidObjectId(preparationId) ||
      !mongoose.isValidObjectId(dayId) ||
      !mongoose.isValidObjectId(taskId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation, day, or task ID.",
      });
    }

    if (typeof isCompleted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isCompleted must be true or false.",
      });
    }

    const plan = await PreparationPlan.findOne({
      preparation: preparationId,
      user: userId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Preparation plan not found.",
      });
    }

    const day = plan.days.id(dayId);

    if (!day) {
      return res.status(404).json({
        success: false,
        message: "Preparation day not found.",
      });
    }

    const task = day.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Preparation task not found.",
      });
    }

    task.isCompleted = isCompleted;
    task.completedAt = isCompleted ? new Date() : null;

    await plan.save();

    const allTasks = plan.days.flatMap((item) => item.tasks);
    const completedTasks = allTasks.filter((item) => item.isCompleted).length;
    const progress = allTasks.length
      ? Math.round((completedTasks / allTasks.length) * 100)
      : 0;

    await Preparation.updateOne(
      { _id: preparationId, user: userId },
      { $set: { progress } }
    );

    // Queue any milestones whose preparation threshold has been reached.
    // The queue function returns immediately; the user does not wait for Gemini.
    const milestonesToQueue = [];

    if (progress >= 70) milestonesToQueue.push(75);
    if (progress >= 95) milestonesToQueue.push(100);

    for (const milestone of milestonesToQueue) {
      queueQuestionSetGeneration({
        preparationId,
        userId,
        milestone,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task completion updated successfully.",
      task: {
        _id: task._id,
        isCompleted: task.isCompleted,
        completedAt: task.completedAt,
      },
      progress,
      completedTasks,
      totalTasks: allTasks.length,
      backgroundGenerationQueued: milestonesToQueue,
    });
  } catch (error) {
    console.error("Update task completion error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update task completion.",
    });
  }
};

module.exports = { updateTaskCompletion };
