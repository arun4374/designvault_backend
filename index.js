const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google OAuth Client
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/auth/google/callback`
);

/**
 * Route: GET /auth/google/callback
 * Description: Handles the redirect from Google with the authorization code.
 */
app.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;

  // Default to localhost:5173 if state is missing (e.g. direct access)
  // The frontend sends window.location.href as state
  const returnUrl = state || FRONTEND_URL;

  if (!code) {
    const separator = returnUrl.includes('?') ? '&' : '?';
    return res.redirect(`${returnUrl}${separator}google_auth_error=no_code`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // 2. Fetch user information using the access token
    const userRes = await oAuth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });
    const user = userRes.data;

    // 3. Redirect back to the frontend with user data
    const userData = encodeURIComponent(JSON.stringify({
      name: user.name,
      email: user.email,
      avatar: user.picture,
    }));

    const separator = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${separator}google_auth_success=true&user_data=${userData}`);

  } catch (error) {
    console.error('Error during Google Auth:', error);
    const separator = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${separator}google_auth_error=failed`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
