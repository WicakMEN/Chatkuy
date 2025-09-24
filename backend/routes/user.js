const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../config/auth');
const { searchUserByEmail, getUser } = require('../config/firestore');

// GET /api/users/search?email=example@email.com - Search user by email
router.get('/search', verifyFirebaseToken, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        error: 'Missing email parameter',
        message: 'Email parameter is required for search'
      });
    }
    
    // Don't allow users to search for themselves
    if (email === req.user.email) {
      return res.status(400).json({
        error: 'Cannot search yourself',
        message: 'You cannot send friend request to yourself'
      });
    }
    
    const foundUser = await searchUserByEmail(email);
    
    if (!foundUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with this email address'
      });
    }
    
    // Return limited user info for privacy
    res.json({
      success: true,
      user: {
        uid: foundUser.uid,
        displayName: foundUser.displayName,
        email: foundUser.email,
        photoURL: foundUser.photoURL
      }
    });
    
  } catch (error) {
    console.error('Search user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search user'
    });
  }
});

// GET /api/users/profile/:uid - Get user profile by UID
router.get('/profile/:uid', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.params;
    
    const userData = await getUser(uid);
    
    if (!userData) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    // Return limited user info for privacy
    res.json({
      success: true,
      user: {
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL
      }
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user profile'
    });
  }
});

module.exports = router;