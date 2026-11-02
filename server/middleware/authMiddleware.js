
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  try {
    // Read token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first."
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach authenticated user ID to request
    req.user = {
      id: decoded.id
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = protect;
