
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const daySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    focus: {
      type: String,
      required: true,
      trim: true,
    },
    tasks: {
      type: [taskSchema],
      validate: {
        validator: (tasks) => tasks.length > 0,
        message: "Each preparation day must have at least one task.",
      },
    },
  },
  { _id: true }
);

const preparationPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    preparation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Preparation",
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    overview: {
      type: String,
      required: true,
      trim: true,
    },

    days: {
      type: [daySchema],
      required: true,
      validate: {
        validator: (days) =>
          days.length > 0 &&
          days.every((day, index) => day.day === index + 1),
        message:
          "Plan days must be numbered sequentially, starting from 1.",
      },
    },
  },
  {
    timestamps: true,
  }
);

preparationPlanSchema.index({ user: 1, createdAt: -1 });

const PreparationPlan = mongoose.model(
  "PreparationPlan",
  preparationPlanSchema
);

module.exports = PreparationPlan;
