
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Resume = require("../models/resume.model");
const Preparation = require("../models/preparation.model");
const PreparationPlan = require("../models/preparationPlan.model");
const InterviewPractice = require("../models/interviewPractice.model");
const MockInterview = require("../models/mockInterview.model");
const MockInterviewQuestionSet = require("../models/mockInterviewQuestionSet.model");
const InterviewEvaluationJob = require("../models/interviewEvaluationJob.model");
const { SESSION_COOKIE } = require("../middleware/auth.middleware");

const clearSessionCookie = (req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: req.secure || process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "name email targetRole profileImage createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, targetRole, profileImage } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 ||
          name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 100 characters.",
        });
      }

      updates.name = name.trim();
    }

    if (targetRole !== undefined) {
      if (typeof targetRole !== "string") {
        return res.status(400).json({
          success: false,
          message: "Target role must be a string.",
        });
      }

      updates.targetRole = targetRole.trim();
    }

    if (profileImage !== undefined) {
      if (typeof profileImage !== "string") {
        return res.status(400).json({
          success: false,
          message: "Profile image must be a URL string.",
        });
      }

      updates.profileImage = profileImage.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email targetRole profileImage createdAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

const getProfileStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      totalPreparations,
      completedPreparations,
      preparationPlans,
      completedMockInterviews,
    ] = await Promise.all([
      Preparation.countDocuments({ user: userId }),

      Preparation.countDocuments({
        user: userId,
        status: "COMPLETED",
      }),

      PreparationPlan.find({ user: userId })
        .select("preparation days.tasks.isCompleted")
        .lean(),

      MockInterview.countDocuments({
        user: userId,
        status: "completed",
      }),
    ]);

    let totalTasks = 0;
    let completedTasks = 0;

    for (const plan of preparationPlans) {
      for (const day of plan.days || []) {
        for (const task of day.tasks || []) {
          totalTasks++;

          if (task.isCompleted) {
            completedTasks++;
          }
        }
      }
    }

    const taskCompletionPercentage =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return res.status(200).json({
      success: true,
      stats: {
        totalPreparations,
        completedPreparations,
        completedMockInterviews,
        totalTasks,
        completedTasks,
        taskCompletionPercentage,
      },
    });
  } catch (error) {
    console.error("Get profile stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile statistics.",
    });
  }
};


const getProfilePreparations = async (req, res) => {
  try {
    const preparations = await Preparation.find({
      user: req.user.userId,
    })
      .select(
        "targetRole targetCompany duration status progress startDate createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      success: true,
      preparations,
    });
  } catch (error) {
    console.error("Get profile preparations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch preparation history.",
    });
  }
};

const deleteAccount = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();
    const userId = req.userId;
    await session.withTransaction(async () => {
      const interviews = await MockInterview.find({ user: userId })
        .select("_id")
        .session(session)
        .lean();
      const interviewIds = interviews.map((item) => item._id);

      await InterviewEvaluationJob.deleteMany(
        { interview: { $in: interviewIds } },
        { session }
      );
      await MockInterviewQuestionSet.deleteMany({ user: userId }, { session });
      await MockInterview.deleteMany({ user: userId }, { session });
      await InterviewPractice.deleteMany({ user: userId }, { session });
      await PreparationPlan.deleteMany({ user: userId }, { session });
      await Preparation.deleteMany({ user: userId }, { session });
      await Resume.deleteMany({ user: userId }, { session });
      await User.deleteOne({ _id: userId }, { session });
    });

    clearSessionCookie(req, res);

    return res.status(200).json({
      success: true,
      message: "Your account and associated preparation data were deleted.",
    });
  } catch (error) {
    console.error("Delete account error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete the account. Please try again.",
    });
  } finally {
    if (session) await session.endSession();
  }
};



module.exports = {
  getProfile,
  updateProfile,
  getProfileStats,
  getProfilePreparations,
  deleteAccount,
};

