
const mongoose = require("mongoose");

const Preparation = require("../models/preparation.model");
const Resume = require("../models/resume.model");
const PreparationPlan = require("../models/preparationPlan.model");

const {
  generatePreparationPlan,
} = require("../services/aiPreparation.service");

const {
  queueQuestionSetGeneration,
} = require("../services/mockInterviewQuestionSet.service");

// Generate and save a personalized preparation plan
const generateMyPreparationPlan = async (req, res) => {
  try {
    const { preparationId } = req.params;
    const userId = req.userId;

    if (!mongoose.isValidObjectId(preparationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation ID.",
      });
    }

    // Find the preparation belonging to the logged-in user
    const preparation = await Preparation.findOne({
      _id: preparationId,
      user: userId,
    });

    if (!preparation) {
      return res.status(404).json({
        success: false,
        message: "Preparation not found.",
      });
    }

    // Return the existing plan if one has already been generated
    const existingPlan = await PreparationPlan.findOne({
      preparation: preparation._id,
      user: userId,
    });

    if (existingPlan) {
      return res.status(200).json({
        success: true,
        message: "Your preparation plan is ready.",
        plan: existingPlan,
        alreadyExists: true,
      });
    }

    // Retrieve the resume and verify ownership
    const resume = await Resume.findOne({
      _id: preparation.resumeId,
      user: userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message:
          "Resume not found. Please upload your resume again.",
      });
    }

    if (!resume.extractedText?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "No readable text was found in your resume. Please upload a readable PDF.",
      });
    }

    // Generate the plan using the existing Gemini service
    const generatedPlan = await generatePreparationPlan({
      targetRole: preparation.targetRole,
      experience: preparation.experience,
      targetCompany: preparation.targetCompany,
      jobDescription: preparation.jobDescription,
      interviewTypes: preparation.interviewTypes,
      difficulty: preparation.difficulty,
      duration: preparation.duration,
      dailyTime: preparation.dailyTime,
      resumeText: resume.extractedText,
    });

    // Save the generated plan in MongoDB
    const plan = await PreparationPlan.create({
      user: userId,
      preparation: preparation._id,
      title: generatedPlan.title,
      overview: generatedPlan.overview,
      days: generatedPlan.days.map((day) => ({
        day: day.day,
        title: day.title,
        focus: day.focus,
        tasks: day.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          durationMinutes: task.durationMinutes,
          type: task.type,
          isCompleted: false,
          completedAt: null,
        })),
      })),
    });

    // Start preparing the 50% mock test in the background.
    // The test itself remains locked until preparation progress reaches 50%.
    queueQuestionSetGeneration({
      preparationId: preparation._id,
      userId,
      milestone: 50,
    });

    return res.status(201).json({
      success: true,
      message: "Preparation plan generated successfully.",
      plan,
      alreadyExists: false,
    });
  } catch (error) {
    // A duplicate can occur if two requests generate the same plan
    if (error.code === 11000) {
      try {
        const existingPlan = await PreparationPlan.findOne({
          preparation: req.params.preparationId,
          user: req.userId,
        });

        if (existingPlan) {
          return res.status(200).json({
            success: true,
            message: "Your preparation plan is ready.",
            plan: existingPlan,
            alreadyExists: true,
          });
        }
      } catch (lookupError) {
        console.error(
          "Existing plan lookup error:",
          lookupError.message
        );
      }
    }

    
console.error("Generate preparation plan error:", {
  message: error.message,
  name: error.name,
  code: error.code,
  status: error.status,
  stack: error.stack,
});


    return res.status(500).json({
      success: false,
      message:
        "Unable to generate your preparation plan. Please try again.",
    });
  }
};

// Retrieve a saved plan without generating it again
const getMyPreparationPlan = async (req, res) => {
  try {
    const { preparationId } = req.params;

    if (!mongoose.isValidObjectId(preparationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation ID.",
      });
    }

    const plan = await PreparationPlan.findOne({
      preparation: preparationId,
      user: req.userId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "No preparation plan has been generated yet.",
      });
    }

    return res.status(200).json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Get preparation plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your preparation plan.",
    });
  }
};

module.exports = {
  generateMyPreparationPlan,
  getMyPreparationPlan,
};
