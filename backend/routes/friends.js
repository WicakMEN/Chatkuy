const express = require("express");
const router = express.Router();
const {
  addFriend,
  getFriends,
  removeFriend,
  searchUserByEmailExcludingSelf,
  areFriends,
  createOrUpdateUser,
} = require("../config/firestore");
const verifyFirebaseToken = require("../config/auth");

// Middleware to verify authentication
router.use(verifyFirebaseToken);

// Search user by email for adding as friend
router.get("/search", async (req, res) => {
  try {
    console.log(
      "🔍 Friends search - User:",
      req.user.email,
      "searching for:",
      req.query.email
    );
    const { email } = req.query;
    const currentUserUid = req.user.uid;

    if (!email) {
      console.log("❌ Friends search - No email provided");
      return res.status(400).json({
        success: false,
        message: "Email parameter is required",
      });
    }

    const user = await searchUserByEmailExcludingSelf(email, currentUserUid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Check if already friends
    const alreadyFriends = await areFriends(currentUserUid, user.uid);

    res.json({
      success: true,
      user: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        alreadyFriends,
      },
    });
  } catch (error) {
    console.error("Error searching user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Add friend
router.post("/add", async (req, res) => {
  try {
    console.log("➕ Add friend - Request body:", req.body);
    console.log("➕ Add friend - User:", req.user.email);

    const { friendUid } = req.body;
    const currentUserUid = req.user.uid;

    console.log("➕ Add friend - friendUid from body:", friendUid);
    console.log("➕ Add friend - currentUserUid:", currentUserUid);

    if (!friendUid) {
      console.log("❌ Add friend - No friendUid provided");
      return res.status(400).json({
        success: false,
        message: "Friend UID is required",
      });
    }

    const result = await addFriend(currentUserUid, friendUid);

    res.json({
      success: true,
      message: "Friend added successfully!",
      friend: result.friendData,
    });
  } catch (error) {
    console.error("Error adding friend:", error);

    let message = "Failed to add friend";
    if (error.message === "Already friends") {
      message = "You are already friends with this user";
    } else if (error.message === "Cannot add yourself as friend") {
      message = "You cannot add yourself as a friend";
    } else if (error.message === "User or friend not found") {
      message = "User not found";
    }

    res.status(400).json({
      success: false,
      message,
    });
  }
});

// Get friends list
router.get("/list", async (req, res) => {
  try {
    console.log(
      "📋 Friends list - User:",
      req.user.email,
      "requesting friends list"
    );
    const currentUserUid = req.user.uid;

    const friends = await getFriends(currentUserUid);
    console.log(
      "✅ Friends list - Found",
      friends.length,
      "friends for user:",
      req.user.email
    );

    res.json({
      success: true,
      friends,
      count: friends.length,
    });
  } catch (error) {
    console.error("❌ Error getting friends list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get friends list",
    });
  }
});

// Remove friend
router.delete("/remove", async (req, res) => {
  try {
    const { friendUid } = req.body;
    const currentUserUid = req.user.uid;

    if (!friendUid) {
      return res.status(400).json({
        success: false,
        message: "Friend UID is required",
      });
    }

    const result = await removeFriend(currentUserUid, friendUid);

    res.json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove friend",
    });
  }
});

// Check friendship status
router.get("/check/:friendUid", async (req, res) => {
  try {
    const { friendUid } = req.params;
    const currentUserUid = req.user.uid;

    const areFriendsResult = await areFriends(currentUserUid, friendUid);

    res.json({
      success: true,
      areFriends: areFriendsResult,
    });
  } catch (error) {
    console.error("Error checking friendship:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check friendship status",
    });
  }
});

module.exports = router;
