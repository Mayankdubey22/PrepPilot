
const InterviewPractice = require("../models/interviewPractice.model");
const Preparation = require("../models/preparation.model");
const Resume = require("../models/resume.model");

const {
  evaluateInterviewAnswer,
} = require("../services/interviewEvaluation.service");

const {
  generateInterviewQuestions,
} = require("../services/interviewPractice.service");

const getInterviewPractice = async (req, res) => {
  try {
    const { preparationId } = req.params;

    const preparation = await Preparation.findOne({
      _id: preparationId,
      user: req.userId,
    });

    if (!preparation) {
      return res.status(404).json({
        success: false,
        message: "Preparation not found.",
      });
    }

    const practice = await InterviewPractice.findOne({
      user: req.userId,
      preparation: preparation._id,
    });

    return res.status(200).json({
      success: true,
      practice,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation ID.",
      });
    }

    console.error("Get interview practice error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve interview practice.",
    });
  }
};

const createInterviewPractice = async (req, res) => {
  try {
    const { preparationId } = req.params;

    const preparation = await Preparation.findOne({
      _id: preparationId,
      user: req.userId,
    });

    if (!preparation) {
      return res.status(404).json({
        success: false,
        message: "Preparation not found.",
      });
    }

    const existingPractice = await InterviewPractice.findOne({
      user: req.userId,
      preparation: preparation._id,
    });

    if (existingPractice) {
      return res.status(200).json({
        success: true,
        message: "Interview practice already exists.",
        practice: existingPractice,
      });
    }

    const resume = await Resume.findOne({
      _id: preparation.resumeId,
      user: req.userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found for this preparation.",
      });
    }

    const questions = await generateInterviewQuestions({
      targetRole: preparation.targetRole,
      experience: preparation.experience,
      targetCompany: preparation.targetCompany,
      jobDescription: preparation.jobDescription,
      interviewTypes: preparation.interviewTypes,
      difficulty: preparation.difficulty,
      resumeText: resume.extractedText,
    });

    const practice = await InterviewPractice.create({
      user: req.userId,
      preparation: preparation._id,
      questions,
      status: "in-progress",
    });

    return res.status(201).json({
      success: true,
      message: "Interview questions generated successfully.",
      practice,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation ID.",
      });
    }

    console.error("Create interview practice error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate interview questions. Please try again.",
    });
  }
};


const saveInterviewAnswer = async (req, res) => {
  try {
    const { preparationId, questionId } = req.params;
    const { userAnswer } = req.body;

    if (typeof userAnswer !== "string") {
      return res.status(400).json({
        success: false,
        message: "Answer must be a string.",
      });
    }

    if (userAnswer.length > 15000) {
      return res.status(400).json({
        success: false,
        message: "Answer cannot exceed 15000 characters.",
      });
    }

    const practice = await InterviewPractice.findOne({
      user: req.userId,
      preparation: preparationId,
    });

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: "Interview practice session not found.",
      });
    }

    const question = practice.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found.",
      });
    }

    question.userAnswer = userAnswer;
    question.answeredAt = userAnswer.trim() ? new Date() : null;

    if (userAnswer.trim() && practice.status === "not-started") {
      practice.status = "in-progress";
    }

    await practice.save();

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully.",
      question: {
        _id: question._id,
        userAnswer: question.userAnswer,
        answeredAt: question.answeredAt,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation or question ID.",
      });
    }

    console.error("Save interview answer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save your answer.",
    });
  }
};


const evaluateAnswer = async (req, res) => {
  try {
    const { preparationId, questionId } = req.params;

    const practice = await InterviewPractice.findOne({
      user: req.userId,
      preparation: preparationId,
    });

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: "Interview practice session not found.",
      });
    }

    const question = practice.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found.",
      });
    }

    if (!question.userAnswer || !question.userAnswer.trim()) {
      return res.status(400).json({
        success: false,
        message: "Save your answer before requesting evaluation.",
      });
    }

    const preparation = await Preparation.findOne({
      _id: preparationId,
      user: req.userId,
    });

    if (!preparation) {
      return res.status(404).json({
        success: false,
        message: "Preparation not found.",
      });
    }

    const evaluation = await evaluateInterviewAnswer({
      question: question.question,
      topic: question.topic,
      expectedPoints: question.expectedPoints,
      userAnswer: question.userAnswer,
      targetRole: preparation.targetRole,
    });

    question.evaluation = evaluation;
    await practice.save();

    return res.status(200).json({
      success: true,
      message: "Answer evaluated successfully.",
      evaluation: question.evaluation,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation or question ID.",
      });
    }

    console.error("Evaluate interview answer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to evaluate your answer. Please try again.",
    });
  }
};


const getInterviewPracticeStats = async (req, res) => {
  try {
    const practices = await InterviewPractice.find({
      user: req.userId,
    })
      .populate("preparation", "targetRole targetCompany")
      .lean();

    const activities = [];

    let attemptedQuestions = 0;
    let evaluatedQuestions = 0;
    let totalScore = 0;

    for (const practice of practices) {
      const questions = practice.questions || [];
      const preparation = practice.preparation;

      for (const question of questions) {
        const hasAnswer =
          typeof question.userAnswer === "string" &&
          question.userAnswer.trim().length > 0;

        const score = question.evaluation?.score;

        const hasValidScore =
          hasAnswer &&
          typeof score === "number" &&
          Number.isFinite(score) &&
          score >= 0 &&
          score <= 100;

        if (hasAnswer) {
          attemptedQuestions++;
        }

        if (hasValidScore) {
          evaluatedQuestions++;
          totalScore += score;
        }

        if (hasAnswer || hasValidScore) {
          const answeredAt = question.answeredAt
            ? new Date(question.answeredAt)
            : null;

          const evaluatedAt = question.evaluation?.evaluatedAt
            ? new Date(question.evaluation.evaluatedAt)
            : null;

          const validAnsweredAt =
            answeredAt && !Number.isNaN(answeredAt.getTime())
              ? answeredAt
              : null;

          const validEvaluatedAt =
            evaluatedAt && !Number.isNaN(evaluatedAt.getTime())
              ? evaluatedAt
              : null;

          let activityDate = validAnsweredAt;

          if (
            validEvaluatedAt &&
            (!activityDate || validEvaluatedAt > activityDate)
          ) {
            activityDate = validEvaluatedAt;
          }

          activities.push({
            questionId: question._id,
            question: question.question,
            topic: question.topic || "General",
            targetRole: preparation?.targetRole || "Interview Preparation",
            targetCompany: preparation?.targetCompany || "",
            answered: hasAnswer,
            evaluated: hasValidScore,
            score: hasValidScore ? score : null,
            activityDate,
          });
        }
      }
    }

    activities.sort((a, b) => {
      const dateA = a.activityDate
        ? new Date(a.activityDate).getTime()
        : 0;

      const dateB = b.activityDate
        ? new Date(b.activityDate).getTime()
        : 0;

      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      stats: {
        attemptedQuestions,
        evaluatedQuestions,
        averageScore:
          evaluatedQuestions > 0
            ? Math.round(totalScore / evaluatedQuestions)
            : null,
      },
      recentActivity: activities.slice(0, 5),
    });
  } catch (error) {
    console.error("Get interview practice stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve interview practice statistics.",
    });
  }
};



module.exports = {
  getInterviewPractice,
  createInterviewPractice,
  saveInterviewAnswer,
  evaluateAnswer,
  getInterviewPracticeStats,
};

