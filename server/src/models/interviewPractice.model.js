
const mongoose = require("mongoose");

const interviewQuestionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
        },
        topic: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            default: "Technical",
            trim: true,
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium",
        },
        options: {
            type: [String],
            default: [],
        },
        correctOption: {
            type: Number,
            min: 0,
            max: 3,
            select: false,
        },
        expectedPoints: {
            type: [String],
            default: [],
        },
        userAnswer: {
            type: String,
            default: "",
        },
        evaluation: {
            score: {
                type: Number,
                min: 0,
                max: 100,
            },
            strengths: {
                type: [String],
                default: [],
            },
            improvements: {
                type: [String],
                default: [],
            },
            suggestedAnswer: {
                type: String,
                default: "",
            },
            feedback: {
                type: String,
                default: "",
            },
            evaluatedAt: {
                type: Date,
            },
        },
        answeredAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

const interviewPracticeSchema = new mongoose.Schema(
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
        },
        questions: {
            type: [interviewQuestionSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ["not-started", "in-progress", "completed"],
            default: "not-started",
        },
    },
    { timestamps: true }
);

interviewPracticeSchema.index(
    { user: 1, preparation: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "InterviewPractice",
    interviewPracticeSchema
);
