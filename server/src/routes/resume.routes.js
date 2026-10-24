
const express = require("express");

const { uploadResume } = require("../controllers/resume.controller");
const protect = require("../middleware/auth.middleware");
const uploadResumeFile = require("../middleware/resumeUpload.middleware");

const router = express.Router();

router.post("/", protect, uploadResumeFile, uploadResume);

module.exports = router;
