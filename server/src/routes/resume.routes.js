
const express = require("express");

const { uploadResume } = require("../controllers/resume.controller");
const protect = require("../middleware/auth.middleware");
const uploadResumeFile = require("../middleware/resumeUpload.middleware");
const { createRateLimiter, userIdentity } = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.post(
  "/",
  protect,
  createRateLimiter({
    scope: "resume-upload",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    identity: userIdentity,
  }),
  uploadResumeFile,
  uploadResume
);

module.exports = router;
