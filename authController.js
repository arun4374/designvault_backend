const { OAuth2Client } = require('google-auth-library');
const User = require('./User');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Google OAuth Client
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/auth/google/callback`
);

exports.initiateGoogleLogin = (req, res) => {
  // Use the 'from' query param or default to frontend URL as state
  const state = req.query.from || FRONTEND_URL;

  const authorizationUrl = oAuth2Client.generateAuthUrl({
    access_type: 'online', // 'online' avoids forcing a refresh token, reducing consent screens
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    include_granted_scopes: true,
    state: state,
    prompt: 'select_account' // 'select_account' allows account switching but doesn't force consent like 'consent'
  });

  res.redirect(authorizationUrl);
};

exports.handleGoogleCallback = async (req, res) => {
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

    const { sub, name, email, picture } = userRes.data;

    let user = await User.findOne({ googleId: sub });

    // 3 Check user already exits

    if (user) {
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      user = await User.create({
        googleId: sub,
        name,
        email,
        avatar: picture,
        role: 'USER',
        lastLoginAt: new Date()
      });
    }

    // 4 ALWAYS SEND DATA FROM DATABASE
    const userData = encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    }));

    const separator = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${separator}google_auth_success=true&user_data=${userData}`);

  } catch (error) {
    console.error('Error during Google Auth:', error);
    const separator = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${separator}google_auth_error=failed`);
  }
};
