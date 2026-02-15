const User = require('./User');

const protect = async (req, res, next) => {
  try {
    let userId = req.headers['x-user-id']?.trim();

    if (!userId && req.body && (req.body.userId || req.body.googleId)) {
      userId = String(req.body.userId || req.body.googleId).trim();
    }

    if (!userId && req.query && (req.query.userId || req.query.googleId)) {
      userId = String(req.query.userId || req.query.googleId).trim();
    }

    if (!userId) {
      console.warn('Auth Middleware: x-user-id header missing. Received headers:', req.headers);
      return res.status(401).json({ message: 'Not authorized, no user ID provided' });
    }

    let user;
    // Check if userId is a valid ObjectId hex string to avoid CastError
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
    }

    // If not found by ID (or invalid ID format), try finding by googleId
    if (!user) {
      user = await User.findOne({ googleId: userId });
    }

    if (!user) {
      console.warn(`Auth Middleware: User not found for ID: ${userId}`);
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const protectAdmin = async (req, res, next) => {
  try {
    // 1. Get the user ID from the headers.
    // NOTE: In a production app, you should verify a secure token (like JWT) here instead of a raw user ID.
    const userId = req.headers['x-user-id']?.trim();

    if (!userId) {
      console.warn('Admin Auth Middleware: x-user-id header missing. Received headers:', req.headers);
      return res.status(401).json({ message: 'Not authorized, no user ID provided' });
    }

    // 2. Find the user in the database
    let user;
    // Check if userId is a valid ObjectId hex string
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
    }

    // If not found by ID, try finding by googleId
    if (!user) {
      user = await User.findOne({ googleId: userId });
    }

    if (!user) {
      console.warn(`Admin Auth Middleware: User not found for ID: ${userId}`);
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // 3. Check if the user has the ADMIN role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    // 4. Attach user to request object and proceed
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { protect, protectAdmin };
