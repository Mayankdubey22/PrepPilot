const crypto = require("crypto");
const RateLimitCounter = require("../models/rateLimitCounter.model");

const createRateLimiter = ({
  scope,
  limit,
  windowMs,
  identity = (req) => req.ip || "unknown",
}) => async (req, res, next) => {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const identityHash = crypto
    .createHmac("sha256", process.env.JWT_SECRET || "rate-limit")
    .update(String(identity(req)))
    .digest("hex");
  const key = `${scope}:${identityHash}:${bucket}`;
  const expiresAt = new Date((bucket + 2) * windowMs);

  try {
    let counter;

    try {
      counter = await RateLimitCounter.findOneAndUpdate(
        { key },
        { $inc: { hits: 1 }, $setOnInsert: { expiresAt } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      counter = await RateLimitCounter.findOneAndUpdate(
        { key },
        { $inc: { hits: 1 } },
        { new: true }
      );
    }

    const remainingMs = Math.max(1, (bucket + 1) * windowMs - now);
    res.set("RateLimit-Limit", String(limit));
    res.set("RateLimit-Remaining", String(Math.max(0, limit - counter.hits)));

    if (counter.hits > limit) {
      res.set("Retry-After", String(Math.ceil(remainingMs / 1000)));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait before trying again.",
      });
    }

    return next();
  } catch (error) {
    console.error(`Rate limit check failed (${scope}):`, error.message);
    return res.status(503).json({
      success: false,
      message: "Request protection is temporarily unavailable.",
    });
  }
};

const userIdentity = (req) => String(req.userId || "unauthenticated");

module.exports = { createRateLimiter, userIdentity };
