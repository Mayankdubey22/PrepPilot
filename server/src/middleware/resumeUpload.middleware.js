
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("Only PDF files are allowed."));
    }

    callback(null, true);
  },
});

const uploadResumeFile = (req, res, next) => {
  upload.single("resume")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "Resume must not exceed 5 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Unable to upload the resume.",
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid resume file.",
      });
    }

    next();
  });
};

module.exports = uploadResumeFile;
