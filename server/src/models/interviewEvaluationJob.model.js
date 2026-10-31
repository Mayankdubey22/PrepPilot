const mongoose = require("mongoose");

const interviewEvaluationJobSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockInterview",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    nextRunAt: { type: Date, default: Date.now, index: true },
    lockedAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
  },
  { timestamps: true }
);

interviewEvaluationJobSchema.index({ status: 1, nextRunAt: 1, createdAt: 1 });

module.exports = mongoose.model(
  "InterviewEvaluationJob",
  interviewEvaluationJobSchema
);
