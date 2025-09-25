const admin = require("firebase-admin");

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    console.log(
      "🔐 Auth middleware - Headers:",
      req.headers.authorization ? "Token present" : "No token in headers"
    );
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      console.log("❌ Auth middleware - No token provided");
      return res.status(401).json({
        error: "No token provided",
        message: "Authorization header with Bearer token is required",
      });
    }

    console.log(
      "🎫 Auth middleware - Token received:",
      token.substring(0, 50) + "..."
    );

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log(
      "✅ Auth middleware - Token verified for user:",
      decodedToken.email
    );

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    console.error(
      "❌ Auth middleware - Token verification error:",
      error.message
    );
    return res.status(401).json({
      error: "Invalid token",
      message: "The provided token is invalid or expired",
    });
  }
};

module.exports = verifyFirebaseToken;
