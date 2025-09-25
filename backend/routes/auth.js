const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../config/auth");
const { createOrUpdateUser, getUser } = require("../config/firestore");

// POST /api/auth/login - Handle user login/registration
router.post("/login", verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture, displayName, photoURL } = req.user;
    console.log("🔐 User mencoba login:", {
      uid,
      email,
      name: name || displayName,
    });

    // Create or update user in Firestore - Buat atau update user di Firestore
    const result = await createOrUpdateUser(uid, {
      displayName: name || displayName || "",
      email: email || "",
      photoURL: picture || photoURL || "",
    });
    console.log("✅ User berhasil didaftarkan/diupdate di Firestore:", email);
    console.log("🔍 Result dari createOrUpdateUser:", result);

    // Get updated user data - Ambil data user yang sudah diupdate
    const userData = await getUser(uid);
    console.log("📦 Data user yang didapat dari Firestore:", userData);

    res.json({
      success: true,
      message: "Login berhasil dan user terdaftar di Firestore",
      user: userData,
    });
  } catch (error) {
    console.error("❌ Error saat login dan daftar user:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Gagal memproses login dan pendaftaran user",
      details: error.message,
    });
  }
});

// GET /api/auth/me - Get current user info
router.get("/me", verifyFirebaseToken, async (req, res) => {
  try {
    const userData = await getUser(req.user.uid);

    if (!userData) {
      return res.status(404).json({
        error: "User not found",
        message: "User profile not found in database",
      });
    }

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get user information",
    });
  }
});

// POST /api/auth/logout - Handle user logout
router.post("/logout", verifyFirebaseToken, (req, res) => {
  // For Firebase Auth, logout is handled on the client side
  // This endpoint can be used for additional cleanup if needed
  res.json({
    success: true,
    message: "Logout successful",
  });
});

module.exports = router;
