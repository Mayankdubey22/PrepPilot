
const Preparation = require("../models/preparation.model");
const Resume = require("../models/resume.model");

const createPreparation = async (req, res) => {
  try {
    const {
      targetRole,
      experience,
      targetCompany,
      jobDescription,
      interviewTypes,
      difficulty,
      duration,
      dailyTime,
      resumeId, // Added this
      aiProcessingConsent,
    } = req.body;

    // Validate required preparation details
    if (
      !targetRole ||
      !experience ||
      !interviewTypes ||
      !difficulty ||
      !duration ||
      !dailyTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required preparation details.",
      });
    }

    // Validate interview types
    if (
      !Array.isArray(interviewTypes) ||
      interviewTypes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one interview type is required.",
      });
    }

    // Validate resume ID
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume before creating a preparation.",
      });
    }

    if (aiProcessingConsent !== true) {
      return res.status(400).json({
        success: false,
        message: "Consent to AI processing of resume data is required.",
      });
    }

    // Confirm that this resume belongs to the logged-in user
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found. Please upload your resume again.",
      });
    }

    // Create preparation and link the uploaded resume
    const preparation = await Preparation.create({
      user: req.userId,
      targetRole: targetRole.trim(),
      experience,
      targetCompany: targetCompany?.trim() || "",
      jobDescription: jobDescription?.trim() || "",
      interviewTypes,
      difficulty,
      duration,
      dailyTime,

      // Added resume reference and metadata
      resumeId: resume._id,
      aiProcessingConsentAt: new Date(),
      resume: {
        fileName: resume.fileName,
        fileSize: resume.fileSize,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Preparation created successfully.",
      preparation,
    });
  } catch (error) {
    console.error("Create preparation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create preparation.",
    });
  }
};


const getMyPreparations = async (req, res) => {
  try {
    const userId =
      req.userId ||
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication information is missing.",
      });
    }

    const preparations = await Preparation.find({
      user: userId,
    })
      .populate("resumeId", "fileName fileSize createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: preparations.length,
      preparations,
    });
  } catch (error) {
    console.error("Get preparations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch preparations.",
    });
  }
};


module.exports = {
  createPreparation,
  getMyPreparations,
};
