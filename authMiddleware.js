const User = require('./User');

const protectAdmin = async (req, res, next) => {
  try {
    // 1. Get the user ID from the headers.
    // NOTE: In a production app, you should verify a secure token (like JWT) here instead of a raw user ID.
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, no user ID provided' });
    }

    // 2. Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
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

module.exports = { protectAdmin };
