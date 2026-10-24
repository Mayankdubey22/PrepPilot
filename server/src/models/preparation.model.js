const mongoose = require("mongoose");

const preparationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },

    targetRole: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: String,
      required: true,
      enum: ["Fresher", "0-2 Years", "2+ Years"],
    },

    targetCompany: {
      type: String,
      trim: true,
      default: "",
    },

    jobDescription: {
      type: String,
      trim: true,
      default: "",
    },

    interviewTypes: {
      type: [String],
      required: true,
      enum: ["Technical", "Behavioral", "HR"],
    },

    difficulty: {
      type: String,
      required: true,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },

    duration: {
      type: String,
      required: true,
      enum: ["7 Days", "14 Days", "21 Days", "30 Days"],
    },

    dailyTime: {
      type: String,
      required: true,
      enum: ["30 min", "1 hour", "2 hours", "3+ hours"],
    },

    resume: {
      fileName: {
        type: String,
        default: "",
      },

      fileUrl: {
        type: String,
        default: "",
      },

      fileSize: {
        type: Number,
        default: 0,
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "PAUSED"],
      default: "ACTIVE",
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Preparation = mongoose.model(
  "Preparation",
  preparationSchema
);

module.exports = Preparation;