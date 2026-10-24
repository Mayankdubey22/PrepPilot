const mongoose = require("mongoose");

const mockInterviewQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    topic: { type: String, default: "General" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    type: { type: String, enum: ["MCQ", "Descriptive"], default: "Descriptive" },
    options: { type: [String], default: [] },
    correctOption: { type: Number, default: null, select: false },
    expectedPoints: { type: [String], default: [], select: false },
    userAnswer: { type: String, default: "" },
    markedForReview: { type: Boolean, default: false },
    evaluation: {
      score: { type: Number, min: 0, max: 100, default: null },
      feedback: { type: String, default: "" },
      suggestedAnswer: { type: String, default: "" },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      evaluatedAt: { type: Date, default: null },
    },
    answeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const mockInterviewSchema = new mongoose.Schema(
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
      index: true,
    },
    milestone: {
      type: Number,
      enum: [50, 75, 100],
      required: true,
      default: 50,
      index: true,
    },
    questions: { type: [mockInterviewQuestionSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "completed", "terminated"],
      default: "active",
      index: true,
    },
    evaluationStatus: {
      type: String,
      enum: ["not_started", "pending", "processing", "completed", "failed"],
      default: "not_started",
      index: true,
    },
    durationSeconds: { type: Number, default: 1800, min: 60 },
    actualDurationSeconds: { type: Number, default: null, min: 0 },
    startedAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    terminatedAt: { type: Date, default: null },
    terminationReason: { type: String, default: "" },
    report: {
      averageScore: { type: Number, min: 0, max: 100, default: null },
      totalQuestions: { type: Number, default: 0 },
      answeredQuestions: { type: Number, default: 0 },
      summary: { type: String, default: "" },
      evaluatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

mockInterviewSchema.index({ user: 1, preparation: 1, createdAt: -1 });
mockInterviewSchema.index({ user: 1, preparation: 1, milestone: 1, createdAt: -1 });

module.exports = mongoose.model("MockInterview", mockInterviewSchema);
