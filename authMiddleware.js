const jwt = require('jsonwebtoken');
const User = require('./User');

/*************************************************
 * HOW AUTHENTICATION WORKS (JWT)
 *
 * 1. User logs in via Google OAuth (authController).
 * 2. authController signs a JWT with the user's _id
 *    and sends it to the frontend.
 * 3. Frontend stores it (memory or httpOnly cookie)
 *    and sends it on every request as:
 *      Authorization: Bearer <token>
 * 4. This middleware verifies the JWT signature
 *    using JWT_SECRET. If valid, it loads the user
 *    from the DB and attaches them to req.user.
 *
 * WHY NOT x-user-id?
 * A plain header has no signature — any client can
 * set it to any value and impersonate any user,
 * including admins. JWT tokens are cryptographically
 * signed and cannot be forged without the secret.
 *************************************************/

/*************************************************
 * HELPER: Extract & Verify JWT from request
 *************************************************/
const getUserFromToken = async (req) => {

  const authHeader = req.headers['authorization'];

  // Expect: "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  if (!token) return null;

  // Verify signature + expiry. Throws if invalid/expired.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Token is invalid, tampered with, or expired
    return null;
  }

  // Load the user from DB using the id stored in the token.
  // Single query — no double lookup needed.
  const user = await User.findById(decoded.userId).select('-password');

  return user || null;
};


/*************************************************
 * PROTECT (Login required)
 *************************************************/
const protect = async (req, res, next) => {
  try {

    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        message: 'Authentication required. Please log in.'
      });
    }

    // Block disabled accounts
    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Account disabled. Contact support.'
      });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('Protect middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/*************************************************
 * PROTECT ADMIN (Admin role required)
 *************************************************/
const protectAdmin = async (req, res, next) => {
  try {

    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        message: 'Authentication required. Please log in.'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Account disabled. Contact support.'
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Access denied. Admins only.'
      });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('Admin protect middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  protect,
  protectAdmin
};
