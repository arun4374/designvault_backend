const User = require('./User');

/*************************************************
 * GET USER FROM REQUEST
 *************************************************/

const getUserFromRequest = async (req) => {

  const userId =
    req.headers['x-user-id']?.trim();

  if (!userId) return null;

  let user = null;

  // If Mongo ObjectId
  if (/^[0-9a-fA-F]{24}$/.test(userId)) {
    user = await User.findById(userId);
  }
 console.log(userId);
  // Else Google ID
  if (!user) {
    user = await User.findOne({
      googleId: userId
    });
  }

  return user;
};


/*************************************************
 * PROTECT (LOGIN REQUIRED)
 *************************************************/

const protect = async (req, res, next) => {


  try {
  console.log("HEADERS:", req.headers);
console.log("X-USER-ID:", req.headers['x-user-id']);


    const user = await getUserFromRequest(req);
 console.log(user);
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    // Block inactive users
    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Account disabled'
      });
    }

    req.user = user;

    next();

  } catch (err) {

    console.error('Protect Error:', err);

    res.status(500).json({
      message: 'Server error'
    });
  }
};


/*************************************************
 * ADMIN PROTECT
 *************************************************/

const protectAdmin = async (req, res, next) => {

  try {

    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Account disabled'
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Admins only'
      });
    }

    req.user = user;

    next();

  } catch (err) {

    console.error('Admin Protect Error:', err);

    res.status(500).json({
      message: 'Server error'
    });
  }
};


module.exports = {
  protect,
  protectAdmin
};




