const express = require("express");

const {
  signup,
  signin,
  getCurrentUser,
  signout,
} = require("../controllers/auth.controller");
const protect = require("../middleware/auth.middleware");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.post("/signup", createRateLimiter({
  scope: "signup",
  limit: 5,
  windowMs: 60 * 60 * 1000,
}), signup);
router.post("/signin", createRateLimiter({
  scope: "signin",
  limit: 10,
  windowMs: 15 * 60 * 1000,
}), signin);
router.get("/me", protect, getCurrentUser);
router.post("/signout", protect, signout);

module.exports = router;
