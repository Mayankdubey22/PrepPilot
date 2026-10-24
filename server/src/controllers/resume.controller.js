
const pdfParse = require("pdf-parse");
const Resume = require("../models/resume.model");

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF resume.",
      });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text.trim();

    if (!extractedText) {
      return res.status(422).json({
        success: false,
        message:
          "No readable text was found in this PDF. Try a text-based PDF resume.",
      });
    }

    const resume = await Resume.create({
      user: req.userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: "application/pdf",
      extractedText,
    });

    return res.status(201).json({
      success: true,
      message: "Resume uploaded and text extracted successfully.",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        fileSize: resume.fileSize,
        extractedText: resume.extractedText,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process the resume. Please try another PDF.",
    });
  }
};

module.exports = { uploadResume };
