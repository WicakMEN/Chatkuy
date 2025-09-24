const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../config/auth');
const { createOrUpdateUser, getUser } = require('../config/firestore');

// POST /api/auth/login - Handle user login/registration
router.post('/login', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;
    
    // Create or update user in Firestore
    await createOrUpdateUser(uid, {
      displayName: name,
      email: email,
      photoURL: picture
    });
    
    // Get updated user data
    const userData = await getUser(uid);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userData
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process login request'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const userData = await getUser(req.user.uid);
    
    if (!userData) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found in database'
      });
    }
    
    res.json({
      success: true,
      user: userData
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user information'
    });
  }
});

// POST /api/auth/logout - Handle user logout
router.post('/logout', verifyFirebaseToken, (req, res) => {
  // For Firebase Auth, logout is handled on the client side
  // This endpoint can be used for additional cleanup if needed
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;