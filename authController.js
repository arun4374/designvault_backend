const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('./User');
const Transaction = require('./Schema_Model/Transaction');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/*************************************************
 * ALLOWED FRONTEND ORIGINS
 * FIX: Used to validate the OAuth `state` param
 *      and prevent open redirect attacks.
 *      Add any other valid frontend origins here.
 *************************************************/
const ALLOWED_REDIRECT_ORIGINS = [
  FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

/*************************************************
 * HELPER: Validate redirect URL
 * FIX: Ensures the `state` param from Google's
 *      callback is one of our known origins.
 *      Without this, an attacker can craft a URL
 *      like /auth/google?from=https://evil.com and
 *      redirect users to a phishing site after login.
 *************************************************/
const isSafeReturnUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ALLOWED_REDIRECT_ORIGINS.some((allowed) => {
      const allowedParsed = new URL(allowed);
      return parsed.origin === allowedParsed.origin;
    });
  } catch {
    return false;
  }
};

/*************************************************
 * HELPER: Create OAuth2 Client
 *************************************************/
const createOAuthClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${BACKEND_URL}/auth/google/callback`
  );
};

/*************************************************
 * STEP 1: Redirect user to Google login
 *************************************************/
exports.initiateGoogleLogin = (req, res) => {
  const oAuth2Client = createOAuthClient();

  // Use the 'from' query param as return destination,
  // but only if it's a safe origin — otherwise default to FRONTEND_URL.
  const requestedReturn = req.query.from || FRONTEND_URL;
  const state = isSafeReturnUrl(requestedReturn)
    ? requestedReturn
    : FRONTEND_URL;

  const authorizationUrl = oAuth2Client.generateAuthUrl({
    access_type: 'online',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    include_granted_scopes: true,
    state,
    prompt: 'select_account'
  });

  res.redirect(authorizationUrl);
};

/*************************************************
 * STEP 2: Handle Google's callback
 *************************************************/
exports.handleGoogleCallback = async (req, res) => {
  const oAuth2Client = createOAuthClient();
  const { code, state } = req.query;

  // FIX: Validate state before using as redirect URL.
  //      Falls back to FRONTEND_URL if state is missing or unsafe.
  const returnUrl = (state && isSafeReturnUrl(state))
    ? state
    : FRONTEND_URL;

  if (!code) {
    const sep = returnUrl.includes('?') ? '&' : '?';
    return res.redirect(`${returnUrl}${sep}google_auth_error=no_code`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // 2. Fetch user info from Google
    const userRes = await oAuth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const { sub, name, email, picture } = userRes.data;

    const now = new Date();

    let user = await User.findOne({ googleId: sub });

    if (user) {
      // ---- Returning user ----

      // Daily login bonus (+1 credit)
      const lastLogin = user.lastLoginAt || new Date(0);
      const isSameDay =
        lastLogin.getDate() === now.getDate() &&
        lastLogin.getMonth() === now.getMonth() &&
        lastLogin.getFullYear() === now.getFullYear();

      if (!isSameDay && user.role !== 'ADMIN') {
        // FIX: Use atomic $inc instead of read-modify-write.
        //      Prevents race conditions and bad-value bugs.
        await User.findByIdAndUpdate(user._id, {
          $inc: { credits: 1 },
          $set: { lastLoginAt: now }
        });

        await Transaction.create({
          userId: user._id,
          amount: 1,
          type: 'DAILY_LOGIN',
          description: 'Daily login bonus'
        });

        // Reload user to get updated credits
        user = await User.findById(user._id);
      } else {
        await User.findByIdAndUpdate(user._id, {
          $set: { lastLoginAt: now }
        });
        user = await User.findById(user._id);
      }

    } else {
      // ---- New user ----
      user = await User.create({
        googleId: sub,
        name,
        email,
        avatar: picture,
        role: 'USER',
        credits: 101, // 100 signup + 1 first daily login
        lastLoginAt: now
      });

      await Transaction.create([
        {
          userId: user._id,
          amount: 100,
          type: 'SIGNUP_BONUS',
          description: 'Welcome bonus'
        },
        {
          userId: user._id,
          amount: 1,
          type: 'DAILY_LOGIN',
          description: 'First daily login'
        }
      ]);
    }

    /*************************************************
     * 3. Issue JWT
     *
     * FIX: Previously, the user's full profile (id,
     *      role, email, credits) was serialized into
     *      the redirect URL as a query param. This is
     *      a serious security issue — URLs are stored
     *      in browser history, server logs, and proxy
     *      logs permanently, and role/id data can be
     *      read or replayed by anyone with log access.
     *
     *      Now we sign a JWT containing only userId,
     *      redirect with just the token, and the
     *      frontend calls /api/users/profile to get
     *      the actual user data.
     *************************************************/
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with only the token — no sensitive data in URL
    const sep = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${sep}token=${token}`);

  } catch (error) {
    console.error('Google Auth error:', error);
    const sep = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${sep}google_auth_error=failed`);
  }
};
