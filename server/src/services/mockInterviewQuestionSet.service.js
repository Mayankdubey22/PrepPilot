
const MockInterviewQuestionSet = require("../models/mockInterviewQuestionSet.model");
const Preparation = require("../models/preparation.model");
const { generateInterviewQuestions } = require("./interviewPractice.service");

const QUESTION_LIMIT = 12;
const VALID_MILESTONES = [50, 75, 100];
const STALE_GENERATION_MS = 5 * 60 * 1000;

const normalizeQuestions = (result) => {
  const source = Array.isArray(result) ? result : result?.questions;

  if (!Array.isArray(source) || source.length !== QUESTION_LIMIT) {
    throw new Error("AI must generate exactly 12 questions.");
  }

  const questions = source.map((item) => {
    const type =
      String(item.type || "").toLowerCase() === "mcq"
        ? "MCQ"
        : String(item.type || "").toLowerCase() === "descriptive"
          ? "Descriptive"
          : null;

    if (!type || !String(item.question || "").trim()) {
      throw new Error("AI returned a question with invalid text or type.");
    }

    const expectedPoints = Array.isArray(item.expectedPoints)
      ? item.expectedPoints.filter(
          (point) => typeof point === "string" && point.trim()
        )
      : [];

    const question = {
      question: item.question.trim(),
      topic: item.topic || "General",
      difficulty: ["Easy", "Medium", "Hard"].includes(item.difficulty)
        ? item.difficulty
        : "Medium",
      type,
      options: [],
      correctOption: null,
      expectedPoints,
    };

    if (type === "MCQ") {
      if (!Array.isArray(item.options) || item.options.length !== 4) {
        throw new Error("Every MCQ must have exactly four options.");
      }

      const correctOption = Number(item.correctOption);

      if (
        !Number.isInteger(correctOption) ||
        correctOption < 0 ||
        correctOption > 3
      ) {
        throw new Error("An MCQ has an invalid correct option.");
      }

      question.options = item.options.map(String);
      question.correctOption = correctOption;
    } else if (expectedPoints.length < 2) {
      throw new Error(
        "Every descriptive question must have at least two expected points."
      );
    }

    return question;
  });

  if (
    questions.filter((q) => q.type === "MCQ").length !== 6 ||
    questions.filter((q) => q.type === "Descriptive").length !== 6
  ) {
    throw new Error("The set must contain six MCQs and six descriptive questions.");
  }

  return questions;
};

// Idempotent: only one worker should generate a particular milestone set.
const generateQuestionSetInBackground = async ({
  preparationId,
  userId,
  milestone,
}) => {
  if (!VALID_MILESTONES.includes(Number(milestone))) {
    throw new Error("Milestone must be 50, 75, or 100.");
  }

  milestone = Number(milestone);

  const preparation = await Preparation.findOne({
    _id: preparationId,
    user: userId,
  }).populate("resumeId");

  if (!preparation) {
    throw new Error("Preparation not found.");
  }

  const key = { user: userId, preparation: preparationId, milestone };
  const existing = await MockInterviewQuestionSet.findOne(key);

  if (
    existing?.status === "ready" &&
    existing.questions?.length === QUESTION_LIMIT
  ) {
    return { status: "ready", alreadyReady: true };
  }

  // Don't compete with a live generation request. Allow recovery if it
  // has been stuck for more than five minutes.
  if (existing?.status === "generating") {
    const age = Date.now() - new Date(existing.updatedAt).getTime();

    if (age < STALE_GENERATION_MS) {
      return { status: "generating", alreadyRunning: true };
    }
  }

  let set;

  if (existing) {
    set = await MockInterviewQuestionSet.findOneAndUpdate(
      {
        _id: existing._id,
        status: existing.status,
        updatedAt: existing.updatedAt,
      },
      {
        $set: {
          status: "generating",
          generationError: "",
          questions: [],
        },
      },
      { new: true }
    );

    if (!set) return { status: "generating", alreadyRunning: true };
  } else {
    try {
      set = await MockInterviewQuestionSet.create({
        ...key,
        status: "generating",
        questions: [],
        generationError: "",
      });
    } catch (error) {
      if (error.code === 11000) {
        return { status: "generating", alreadyRunning: true };
      }
      throw error;
    }
  }

  try {
    const resume = preparation.resumeId;
    const generated = await generateInterviewQuestions({
      targetRole: preparation.targetRole,
      experience: preparation.experience,
      targetCompany: preparation.targetCompany,
      jobDescription: preparation.jobDescription,
      interviewTypes: preparation.interviewTypes,
      difficulty: preparation.difficulty,
      resumeText: resume?.extractedText || resume?.text || "",
    });

    const questions = normalizeQuestions(generated);

    const saved = await MockInterviewQuestionSet.findOneAndUpdate(
      { _id: set._id, status: "generating" },
      {
        $set: {
          questions,
          status: "ready",
          generatedAt: new Date(),
          generationError: "",
        },
      },
      { new: true, runValidators: true }
    );

    if (!saved) {
      throw new Error("Question set changed during generation.");
    }

    console.log(`Mock Test ${milestone}% question set is ready.`);
    return { status: "ready", alreadyReady: false };
  } catch (error) {
    await MockInterviewQuestionSet.updateOne(
      { _id: set._id, status: "generating" },
      {
        $set: {
          status: "failed",
          generationError: String(error.message || error).slice(0, 500),
        },
      }
    );

    console.error(`Mock Test ${milestone}% generation failed:`, error.message);
    return { status: "failed", error: error.message };
  }
};

const queueQuestionSetGeneration = ({ preparationId, userId, milestone }) => {
  setImmediate(() => {
    generateQuestionSetInBackground({ preparationId, userId, milestone })
      .catch((error) => {
        console.error(
          `Unable to queue Mock Test ${milestone}% generation:`,
          error.message
        );
      });
  });
};

module.exports = {
  generateQuestionSetInBackground,
  queueQuestionSetGeneration,
};
