
const jwt = require("jsonwebtoken");
const { ALLOWED_ORIGINS } = require("../config/cors.config");

const SESSION_COOKIE = "prepPilot-session";

const getCookie = (req, name) => {
  const cookies = req.headers.cookie || "";
  const entry = cookies.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
};

const protect = (req, res, next) => {
  try {
    const cookieToken = getCookie(req, SESSION_COOKIE);
    const token = cookieToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing.",
      });
    }

    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");

      if (
        !ALLOWED_ORIGINS.includes(origin) ||
        req.get("x-requested-with") !== "XMLHttpRequest"
      ) {
        return res.status(403).json({
          success: false,
          message: "Request origin could not be verified.",
        });
      }
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const userId = decoded.userId || decoded.id;

    if (
      !userId ||
      typeof userId !== "string" && typeof userId !== "object"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token payload.",
      });
    }

    // Support both conventions used by existing controllers.
    req.user = { userId };
    req.userId = userId;

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError" ||
        error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication could not be completed.",
    });
  }
};

module.exports = protect;
module.exports.SESSION_COOKIE = SESSION_COOKIE;
