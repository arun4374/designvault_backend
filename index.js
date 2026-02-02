const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db');
const User = require('./User');
const authController = require('./authController');
const { protectAdmin } = require('./authMiddleware');

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
 * ADMIN: GET ALL USERS
 */
app.get('/admin/users', protectAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
