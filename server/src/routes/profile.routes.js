
const express = require("express");

const {
  getProfile,
  updateProfile,
  getProfileStats,
  getProfilePreparations,
} = require("../controllers/profile.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.get("/stats", getProfileStats);
router.get("/preparations", getProfilePreparations);

module.exports = router;
