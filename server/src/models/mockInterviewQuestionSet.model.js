const mongoose = require("mongoose");

const mockInterviewQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    topic: { type: String, default: "General" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    type: { type: String, enum: ["MCQ", "Descriptive"], required: true },
    options: { type: [String], default: [] },
    correctOption: { type: Number, default: null },
    expectedPoints: { type: [String], default: [] },
  },
  { _id: false }
);

const mockInterviewQuestionSetSchema = new mongoose.Schema(
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
      enum: ["generating", "ready", "failed"],
      default: "generating",
      index: true,
    },
    generationError: { type: String, default: "" },
    generatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One reusable question set per preparation AND milestone.
mockInterviewQuestionSetSchema.index(
  { user: 1, preparation: 1, milestone: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "MockInterviewQuestionSet",
  mockInterviewQuestionSetSchema
);
