const mongoose = require("mongoose");

const MockInterview = require("../models/mockInterview.model");
const MockInterviewQuestionSet = require("../models/mockInterviewQuestionSet.model");
const Preparation = require("../models/preparation.model");
const PreparationPlan = require("../models/preparationPlan.model");

const {
  generateQuestionSetInBackground,
} = require("../services/mockInterviewQuestionSet.service");

const {
  generateInterviewQuestions,
} = require("../services/interviewPractice.service");

const {
  evaluateInterviewAnswer,
} = require("../services/interviewEvaluation.service");
const {
  enqueueInterviewEvaluation,
} = require("../services/interviewEvaluationQueue.service");

const DEFAULT_DURATION_SECONDS = 30 * 60;
const QUESTION_LIMIT = 12;
const VALID_MILESTONES = [50, 75, 100];

const getRequestedMilestone = (req) => {
  const raw = req.query?.milestone ?? req.body?.milestone ?? 50;
  const milestone = Number(raw);
  return VALID_MILESTONES.includes(milestone) ? milestone : null;
};

const getOwnedPreparation = async (preparationId, userId) => {
  if (!mongoose.isValidObjectId(preparationId)) return null;

  return Preparation.findOne({
    _id: preparationId,
    user: userId,
  }).populate("resumeId");
};

const getResumeText = (preparation) => {
  const resume = preparation?.resumeId;

  if (!resume) return "";

  return resume.extractedText || resume.text || "";
};

// Never expose answer keys or expected answers to the client.
const sanitizeInterview = (interview) => {
  if (!interview) return null;

  const data =
    typeof interview.toObject === "function"
      ? interview.toObject()
      : { ...interview };

  data.questions = (data.questions || []).map((question) => {
    const safeQuestion = { ...question };

    delete safeQuestion.correctOption;
    delete safeQuestion.expectedPoints;

    return safeQuestion;
  });

  return data;
};

const sanitizeQuestionSet = (questionSet) => {
  if (!questionSet) return null;

  const data =
    typeof questionSet.toObject === "function"
      ? questionSet.toObject()
      : { ...questionSet };

  data.questions = (data.questions || []).map((question) => {
    const safeQuestion = { ...question };

    delete safeQuestion.correctOption;
    delete safeQuestion.expectedPoints;

    return safeQuestion;
  });

  return data;
};

const normalizeQuestions = (generatedResult) => {
  const generatedQuestions = Array.isArray(generatedResult)
    ? generatedResult
    : generatedResult?.questions;

  if (
    !Array.isArray(generatedQuestions) ||
    generatedQuestions.length !== QUESTION_LIMIT
  ) {
    throw new Error(
      `The AI must generate exactly ${QUESTION_LIMIT} questions.`
    );
  }

  const questions = generatedQuestions.map((question) => {
    const type =
      String(question.type || "").toLowerCase() === "mcq"
        ? "MCQ"
        : "Descriptive";

    const normalized = {
      question: String(question.question || "").trim(),
      topic: question.topic || "General",
      difficulty: ["Easy", "Medium", "Hard"].includes(question.difficulty)
        ? question.difficulty
        : "Medium",
      type,
      options: [],
      correctOption: null,
      expectedPoints: Array.isArray(question.expectedPoints)
        ? question.expectedPoints
        : [],
    };

    if (!normalized.question) {
      throw new Error("The AI returned a question without question text.");
    }

    if (type === "MCQ") {
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error("Every MCQ must contain exactly four options.");
      }

      const correctOption = Number(question.correctOption);

      if (
        !Number.isInteger(correctOption) ||
        correctOption < 0 ||
        correctOption > 3
      ) {
        throw new Error("An MCQ has an invalid correct option.");
      }

      normalized.options = question.options.map((option) =>
        String(option).trim()
      );
      normalized.correctOption = correctOption;

      if (normalized.options.some((option) => !option)) {
        throw new Error("An MCQ contains an empty option.");
      }
    }

    return normalized;
  });

  const mcqCount = questions.filter((question) => question.type === "MCQ").length;
  const descriptiveCount = questions.filter(
    (question) => question.type === "Descriptive"
  ).length;

  if (mcqCount !== 6 || descriptiveCount !== 6) {
    throw new Error(
      "The question set must contain six MCQs and six descriptive questions."
    );
  }

  return questions;
};

// Generate once and persist the question set for this preparation.


const prepareMockInterviewQuestions = async (req, res) => {
  try {
    const preparationId = req.params.preparationId;
    const milestone = Number(
      req.query?.milestone ?? req.body?.milestone ?? 50
    );

    if (![50, 75, 100].includes(milestone)) {
      return res.status(400).json({
        success: false,
        message: "Milestone must be 50, 75, or 100.",
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

    const result = await generateQuestionSetInBackground({
      preparationId,
      userId: req.userId,
      milestone,
    });

    if (result.status === "ready") {
      const questionSet = await MockInterviewQuestionSet.findOne({
        user: req.userId,
        preparation: preparationId,
        milestone,
        status: "ready",
      });

      return res.status(200).json({
        success: true,
        status: "ready",
        message: "Mock test questions are ready.",
        questionSet: sanitizeQuestionSet(questionSet),
      });
    }

    if (result.status === "generating") {
      return res.status(202).json({
        success: true,
        status: "generating",
        message: "Your mock test questions are being prepared.",
      });
    }

    return res.status(502).json({
      success: false,
      status: "failed",
      message: result.error || "Question generation failed. Please retry.",
    });
  } catch (error) {
    console.error("Prepare mock test error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to prepare mock test questions.",
    });
  }
};



// GET /api/mock-interviews/:preparationId
// Returns the latest attempt, all previous attempts, and task-based progress.
const getMockInterview = async (req, res) => {
  try {
    const preparation = await getOwnedPreparation(
      req.params.preparationId,
      req.userId
    );

    if (!preparation) {
      return res.status(404).json({ success: false, message: "Preparation not found." });
    }

    const milestone = getRequestedMilestone(req);
    if (!milestone) {
      return res.status(400).json({
        success: false,
        message: "Milestone must be 50, 75, or 100.",
      });
    }

    const [interviews, milestoneInterviews, questionSet, plan] = await Promise.all([
      MockInterview.find({ user: req.userId, preparation: preparation._id })
        .sort({ createdAt: -1 }),
      MockInterview.find({
        user: req.userId,
        preparation: preparation._id,
        milestone,
      }).sort({ createdAt: -1 }),
      MockInterviewQuestionSet.findOne({
        user: req.userId,
        preparation: preparation._id,
        milestone,
      }),
      PreparationPlan.findOne({ user: req.userId, preparation: preparation._id }),
    ]);

    const tasks = (plan?.days || []).flatMap((day) => day.tasks || []);
    const completedTasks = tasks.filter((task) => task.isCompleted).length;
    const totalTasks = tasks.length;
    const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const submittedAttempts = interviews.filter((item) => item.status === "completed");

    return res.status(200).json({
      success: true,
      interview: sanitizeInterview(milestoneInterviews[0] || null),
      interviews: interviews.map(sanitizeInterview),
      questionSet: sanitizeQuestionSet(questionSet),
      progress: {
        percentage: progress,
        completedTasks,
        totalTasks,
        milestones: {
          mockAt50Unlocked: progress >= 50,
          interviewAt75Unlocked: progress >= 75,
          finalAt100Unlocked: progress >= 100,
        },
        submittedMockCount: submittedAttempts.length,
        selectedMilestone: milestone,
        selectedMilestoneAttemptCount: milestoneInterviews.length,
      },
    });
  } catch (error) {
    console.error("Get mock interview error:", error);
    return res.status(500).json({ success: false, message: "Unable to load the mock interview." });
  }
};

// POST /api/mock-interviews/:preparationId/start
const startMockInterview = async (req, res) => {
  try {
    const preparation = await getOwnedPreparation(
      req.params.preparationId,
      req.userId
    );

    if (!preparation) {
      return res.status(404).json({
        success: false,
        message: "Preparation not found.",
      });
    }

    const plan = await PreparationPlan.findOne({
      user: req.userId,
      preparation: preparation._id,
    });
    const planTasks = (plan?.days || []).flatMap((day) => day.tasks || []);
    const completedTasks = planTasks.filter((task) => task.isCompleted).length;
    const progress = planTasks.length
      ? Math.round((completedTasks / planTasks.length) * 100)
      : 0;

    const milestone = getRequestedMilestone(req);
    if (!milestone) {
      return res.status(400).json({
        success: false,
        message: "Milestone must be 50, 75, or 100.",
      });
    }

    if (progress < milestone) {
      return res.status(403).json({
        success: false,
        code: "MOCK_MILESTONE_LOCKED",
        message: `Complete at least ${milestone}% of your preparation tasks to unlock this mock test. Current progress: ${progress}%.`,
        progress,
        requiredProgress: milestone,
      });
    }

    const existingActiveInterview = await MockInterview.findOne({
      user: req.userId,
      preparation: preparation._id,
      milestone,
      status: "active",
    });

    if (existingActiveInterview) {
      if (
        existingActiveInterview.endsAt &&
        existingActiveInterview.endsAt <= new Date()
      ) {
        existingActiveInterview.status = "terminated";
        existingActiveInterview.terminatedAt = new Date();
        existingActiveInterview.terminationReason = "Time limit exceeded";
        await existingActiveInterview.save();
      } else {
        return res.status(409).json({
          success: false,
          message: "An active mock interview already exists.",
          interview: sanitizeInterview(existingActiveInterview),
        });
      }
    }

    // One official attempt per milestone; each milestone has its own saved set.
    const existingAttemptCount = await MockInterview.countDocuments({
      user: req.userId,
      preparation: preparation._id,
      milestone,
    });

    if (existingAttemptCount >= 1) {
      const existingAttempt = await MockInterview.findOne({
        user: req.userId,
        preparation: preparation._id,
        milestone,
      }).sort({ createdAt: -1 });

      return res.status(409).json({
        success: false,
        code: "MILESTONE_ATTEMPT_USED",
        message: `The Mock Test for the ${milestone}% milestone has already been used. Open its saved result from Preparation.`,
        interview: sanitizeInterview(existingAttempt),
        milestone,
      });
    }

    const questionSet = await MockInterviewQuestionSet.findOne({
      user: req.userId,
      preparation: preparation._id,
      milestone,
      status: "ready",
    });

    if (!questionSet || questionSet.questions.length !== QUESTION_LIMIT) {
      return res.status(409).json({
        success: false,
        message: "Mock interview questions are not ready yet. Prepare them first.",
        code: "QUESTIONS_NOT_READY",
      });
    }

    const questions = questionSet.questions.map((question) => ({
      question: question.question,
      topic: question.topic,
      difficulty: question.difficulty,
      type: question.type,
      options: question.options || [],
      correctOption:
        question.type === "MCQ" ? question.correctOption : null,
      expectedPoints: question.expectedPoints || [],
      userAnswer: "",
      markedForReview: false,
    }));

    const startedAt = new Date();
    const endsAt = new Date(
      startedAt.getTime() + DEFAULT_DURATION_SECONDS * 1000
    );

    let interview;

    try {
      interview = await MockInterview.create({
        user: req.userId,
        preparation: preparation._id,
        milestone,
        attemptKey: `${req.userId}:${preparation._id}:${milestone}`,
        questions,
        status: "active",
        evaluationStatus: "not_started",
        durationSeconds: DEFAULT_DURATION_SECONDS,
        startedAt,
        endsAt,
      });
    } catch (error) {
      // The unique attempt key closes the race between concurrent start requests.
      if (error.code === 11000) {
        const existingAttempt = await MockInterview.findOne({
          user: req.userId,
          preparation: preparation._id,
          milestone,
        }).sort({ createdAt: -1 });

        if (existingAttempt) {
          return res.status(409).json({
            success: false,
            code: "MILESTONE_ATTEMPT_USED",
            message: `The Mock Test for the ${milestone}% milestone has already been used. Open its saved result from Preparation.`,
            interview: sanitizeInterview(existingAttempt),
            milestone,
          });
        }
      }

      throw error;
    }

    return res.status(201).json({
      success: true,
      message: `Mock Test ${milestone} started.`,
      interview: sanitizeInterview(interview),
    });
  } catch (error) {
    console.error("Start mock interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start the mock interview.",
    });
  }
};

// PATCH /api/mock-interviews/:interviewId/questions/:questionId
const saveMockAnswer = async (req, res) => {
  try {
    const { interviewId, questionId } = req.params;
    const { answer } = req.body;

    if (
      !mongoose.isValidObjectId(interviewId) ||
      !mongoose.isValidObjectId(questionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview or question ID.",
      });
    }

    if (typeof answer !== "string") {
      return res.status(400).json({
        success: false,
        message: "Answer must be a string.",
      });
    }

    const interview = await MockInterview.findOne({
      _id: interviewId,
      user: req.userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Mock interview not found.",
      });
    }

    if (interview.status !== "active") {
      return res.status(409).json({
        success: false,
        message: "This mock interview is no longer active.",
      });
    }

    if (!interview.endsAt || interview.endsAt <= new Date()) {
      interview.status = "terminated";
      interview.terminatedAt = new Date();
      interview.terminationReason = "Time limit exceeded";
      await interview.save();

      return res.status(409).json({
        success: false,
        message: "The mock interview time has expired.",
      });
    }

    const question = interview.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    const cleanAnswer = answer.trim();

    if (
      question.type === "MCQ" &&
      cleanAnswer &&
      !["0", "1", "2", "3"].includes(cleanAnswer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid MCQ option.",
      });
    }

    question.userAnswer = cleanAnswer;
    question.answeredAt = cleanAnswer ? new Date() : null;

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Mock interview answer saved.",
      question: {
        _id: question._id,
        userAnswer: question.userAnswer,
        answeredAt: question.answeredAt,
      },
    });
  } catch (error) {
    console.error("Save mock answer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save your answer.",
    });
  }
};

// PATCH /api/mock-interviews/:interviewId/questions/:questionId/review
const toggleQuestionReview = async (req, res) => {
  try {
    const { interviewId, questionId } = req.params;
    const { markedForReview } = req.body;

    if (
      !mongoose.isValidObjectId(interviewId) ||
      !mongoose.isValidObjectId(questionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview or question ID.",
      });
    }

    if (typeof markedForReview !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "markedForReview must be true or false.",
      });
    }

    const interview = await MockInterview.findOne({
      _id: interviewId,
      user: req.userId,
      status: "active",
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Active mock interview not found.",
      });
    }

    if (!interview.endsAt || interview.endsAt <= new Date()) {
      interview.status = "terminated";
      interview.terminatedAt = new Date();
      interview.terminationReason = "Time limit exceeded";
      await interview.save();

      return res.status(409).json({
        success: false,
        message: "The mock interview time has expired.",
      });
    }

    const question = interview.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    question.markedForReview = markedForReview;
    await interview.save();

    return res.status(200).json({
      success: true,
      questionId: question._id,
      markedForReview: question.markedForReview,
    });
  } catch (error) {
    console.error("Toggle question review error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update question review status.",
    });
  }
};

// POST /api/mock-interviews/:interviewId/terminate
const terminateMockInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!mongoose.isValidObjectId(interviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID.",
      });
    }

    const interview = await MockInterview.findOne({
      _id: interviewId,
      user: req.userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Mock interview not found.",
      });
    }

    if (interview.status === "active") {
      interview.status = "terminated";
      interview.terminatedAt = new Date();
      interview.terminationReason =
        typeof req.body?.reason === "string"
          ? req.body.reason.slice(0, 200)
          : "Interview screen exited";

      await interview.save();
    }

    return res.status(200).json({
      success: true,
      message: "Mock interview has been terminated.",
      interview: sanitizeInterview(interview),
    });
  } catch (error) {
    console.error("Terminate mock interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to terminate the mock interview.",
    });
  }
};

// Runs after the submission response has been sent.
const evaluateSubmittedInterview = async (interviewId) => {
  try {
    const interview = await MockInterview.findById(interviewId).select(
      "+questions.correctOption +questions.expectedPoints"
    );

    if (!interview || interview.status !== "completed") return;

    interview.evaluationStatus = "processing";
    await interview.save();

    const preparation = await Preparation.findById(interview.preparation);

    if (!preparation) {
      throw new Error("Preparation not found for evaluation.");
    }

    const answeredQuestions = interview.questions.filter(
      (question) => question.userAnswer?.trim()
    );

    let failedQuestionCount = 0;

    for (const question of answeredQuestions) {
      if (question.evaluation?.score !== null &&
        question.evaluation?.score !== undefined) {
        continue;
      }

      try {
        if (question.type === "MCQ") {
          const selectedIndex = Number(question.userAnswer);
          const isCorrect = selectedIndex === question.correctOption;

          question.evaluation.score = isCorrect ? 100 : 0;
          question.evaluation.feedback = isCorrect
            ? "Correct answer."
            : "Incorrect answer. Review the correct concept.";
          question.evaluation.suggestedAnswer =
            question.options[question.correctOption] || "";
          question.evaluation.strengths = isCorrect
            ? ["Selected the correct option."]
            : [];
          question.evaluation.improvements = isCorrect
            ? []
            : ["Review the topic and understand why the correct option is right."];
          question.evaluation.evaluatedAt = new Date();
        } else {
          const result = await evaluateInterviewAnswer({
            question: question.question,
            topic: question.topic,
            expectedPoints: question.expectedPoints || [],
            userAnswer: question.userAnswer,
            targetRole: preparation.targetRole,
          });

          question.evaluation.score = result.score;
          question.evaluation.feedback = result.feedback || "";
          question.evaluation.suggestedAnswer = result.suggestedAnswer || "";
          question.evaluation.strengths = result.strengths || [];
          question.evaluation.improvements = result.improvements || [];
          question.evaluation.evaluatedAt =
            result.evaluatedAt || new Date();
        }
      } catch (questionError) {
        failedQuestionCount += 1;
        console.error(
          `Evaluation failed for question ${question._id}:`,
          questionError.message || questionError
        );
      }

      // Persist progress after each answer, so partial results are not lost.
      await interview.save();
    }

    const scoredQuestions = interview.questions.filter(
      (question) => question.evaluation?.score !== null &&
        question.evaluation?.score !== undefined
    );

    const averageScore = scoredQuestions.length
      ? Math.round(
        scoredQuestions.reduce(
          (total, question) => total + question.evaluation.score,
          0
        ) / scoredQuestions.length
      )
      : null;

    interview.report.averageScore = averageScore;
    interview.report.totalQuestions = interview.questions.length;
    interview.report.answeredQuestions = answeredQuestions.length;
    interview.report.summary =
      failedQuestionCount > 0
        ? `Evaluation was incomplete: ${scoredQuestions.length} of ${answeredQuestions.length} answered questions were evaluated successfully. Some feedback may be unavailable. You scored ${averageScore == null ? "—" : `${averageScore}%`} across evaluated answers.`
        : averageScore === null
          ? "Your interview was submitted, but no answers could be evaluated. You can review the report and try another mock interview."
          : `You scored ${averageScore}% across ${scoredQuestions.length} evaluated answers. Review each answer's feedback to identify areas for improvement.`;
    interview.report.evaluatedAt = new Date();

    interview.evaluationStatus = failedQuestionCount > 0 ? "failed" : "completed";
    await interview.save();
  } catch (error) {
    console.error("Background mock interview evaluation error:", error);
    throw error;
  }
};

// POST /api/mock-interviews/:interviewId/complete
const completeMockInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!mongoose.isValidObjectId(interviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID.",
      });
    }

    const interview = await MockInterview.findOne({
      _id: interviewId,
      user: req.userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Mock interview not found.",
      });
    }

    if (interview.status !== "active") {
      return res.status(409).json({
        success: false,
        message: "This mock interview is no longer active.",
      });
    }

    if (!interview.endsAt || interview.endsAt <= new Date()) {
      interview.status = "terminated";
      interview.terminatedAt = new Date();
      interview.terminationReason = "Time limit exceeded";
      await interview.save();

      return res.status(409).json({
        success: false,
        message: "The mock interview time has expired.",
      });
    }

    const answeredQuestions = interview.questions.filter(
      (question) => question.userAnswer?.trim()
    ).length;

    const completedAt = new Date();

    interview.status = "completed";
    interview.completedAt = completedAt;
    interview.actualDurationSeconds = Math.max(
      0,
      Math.floor(
        (completedAt.getTime() -
          new Date(interview.startedAt).getTime()) /
        1000
      )
    );
    interview.evaluationStatus = "pending";
    interview.report = {
      totalQuestions: interview.questions.length,
      answeredQuestions,
      averageScore: null,
      summary: "Your answers have been submitted. Evaluation is in progress.",
      evaluatedAt: null,
    };

    await interview.save();

    // Persist the evaluation work before responding so a process restart can
    // resume it from MongoDB.
    await enqueueInterviewEvaluation(interview._id);

    // Send the response before starting evaluation.
    res.status(200).json({
      success: true,
      message: "Interview submitted. Evaluation is running in the background.",
      interview: sanitizeInterview(interview),
    });

  } catch (error) {
    console.error("Complete mock interview error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to submit the mock interview.",
      });
    }
  }
};


// GET /api/mock-interviews/:preparationId/report/:interviewId
// Only the owner of a completed interview can view its detailed report.
const getMockInterviewReport = async (req, res) => {
  try {
    const { preparationId, interviewId } = req.params;

    if (
      !mongoose.isValidObjectId(preparationId) ||
      !mongoose.isValidObjectId(interviewId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation or interview ID.",
      });
    }

    const preparation = await getOwnedPreparation(preparationId, req.userId);

    if (!preparation) {
      return res.status(404).json({
        success: false,
        message: "Preparation not found.",
      });
    }

    const interview = await MockInterview.findOne({
      _id: interviewId,
      preparation: preparation._id,
      user: req.userId,
    }).select("+questions.correctOption +questions.expectedPoints");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Mock interview report not found.",
      });
    }

    if (interview.status !== "completed") {
      return res.status(409).json({
        success: false,
        code: "REPORT_NOT_READY",
        message: "A report is available after the interview is submitted.",
      });
    }

    const reportInterview = interview.toObject();

    // This endpoint is restricted to the owner and a submitted interview.
    // It intentionally includes the correct MCQ answer and expected points.
    reportInterview.questions = (reportInterview.questions || []).map((question) => ({
      ...question,
      correctAnswer:
        question.type === "MCQ" &&
        Number.isInteger(question.correctOption) &&
        question.options?.[question.correctOption] !== undefined
          ? question.options[question.correctOption]
          : "",
    }));

    return res.status(200).json({
      success: true,
      preparation: {
        _id: preparation._id,
        targetRole: preparation.targetRole,
        targetCompany: preparation.targetCompany,
      },
      interview: reportInterview,
    });
  } catch (error) {
    console.error("Get mock interview report error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load the mock interview report.",
    });
  }
};


module.exports = {
  getMockInterview,
  getMockInterviewReport,
  prepareMockInterviewQuestions,
  startMockInterview,
  saveMockAnswer,
  toggleQuestionReview,
  terminateMockInterview,
  completeMockInterview,
  evaluateSubmittedInterview,
};
