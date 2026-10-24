
const express = require("express");

const {
  createPreparation,
  getMyPreparations,
} = require("../controllers/preparation.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getMyPreparations);
router.post("/", protect, createPreparation);

module.exports = router;
