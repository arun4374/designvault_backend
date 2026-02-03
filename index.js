const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db');
const User = require('./User');
const authController = require('./authController');
const { protect, protectAdmin } = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());


// Connect DB

connectDB();

/**
 * Route: GET /auth/google
 * Description: Initiates the Google OAuth flow
 */
app.get('/auth/google', authController.initiateGoogleLogin);

/**
 * Route: GET /auth/google/callback
 * Description: Handles the redirect from Google with the authorization code.
 */
app.get('/auth/google/callback', authController.handleGoogleCallback);

/**
 * Route: POST /api/users/role
 * Description: Get user role by email for frontend protection
 */
app.post('/api/users/role', protect, (req, res) => {
  // req.user is populated by the protect middleware
  res.json({ role: req.user.role });
});

/**
 * ADMIN: GET ALL USERS
 */
app.get('/admin/users', protectAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    // Map fields for frontend compatibility
    const formattedUsers = users.map(user => ({
      ...user,
      lastLogin: user.lastLoginAt,
      status: 'Active' // Default status since it's not in DB yet
    }));
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

/**
 * ADMIN: DELETE USER
 */
app.delete('/admin/users/:id', protectAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
