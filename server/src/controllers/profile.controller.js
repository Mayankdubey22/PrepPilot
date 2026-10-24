
const User = require("../models/user.model");

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


const Preparation = require("../models/preparation.model");
const PreparationPlan = require("../models/preparationPlan.model");
const MockInterview = require("../models/mockInterview.model");

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



module.exports = {
  getProfile,
  updateProfile,
  getProfileStats,
  getProfilePreparations,
};

