const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const connectDB = require('./db');
const User = require('./User');
const authController = require('./authController');
const SystemDesignContribution = require('./Schema_Model/SystemDesignContribution');
const DSAContribution = require('./Schema_Model/DSAContribution');
const COutputContribution = require('./Schema_Model/COutputContribution');
const { protect, protectAdmin } = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 } // 200KB limit
});


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


//  * Route: POST /api/users/role// Find your existing app.use(cors()) and replace it with this:
 
 
//  * Description: Get user role by email for frontend protection

app.post('/api/users/role', protect, (req, res) => {
  // req.user is populated by the protect middleware
  res.json({ role: req.user.role });
});

/**
 * Route: POST /api/contributions
 * Description: Submit a new contribution
 */
app.post('/api/contributions', (req, res, next) => {
  upload.array('files')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(500).json({ success: false, message: `Unknown upload error: ${err.message}` });
    }
    // Everything went fine.
    console.log('--- Contribution Request Debug ---');
    console.log('Headers x-user-id:', req.headers['x-user-id']);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Files count:', req.files ? req.files.length : 0);
    protect(req, res, next);
  });
}, async (req, res) => {
  try {
    console.log('--- Contribution Handler Start ---');
    console.log('User:', req.user);
    const { type, fileMetadata, ...data } = req.body;
    const userId = req.user._id;

    // Common fields
    const commonData = {
      ...data,
      userId,
      authorName: req.user.name || data.authorName,
      status: 'pending'
    };

    let newContribution;
    let processedFiles = [];

    if (req.files && req.files.length > 0) {
      const metadata = fileMetadata ? JSON.parse(fileMetadata) : [];
      processedFiles = await Promise.all(req.files.map(async (file, index) => {
        const fileBuffer = await fs.promises.readFile(file.path);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const extension = path.extname(file.originalname).toLowerCase().replace('.', '');

        return {
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          description: metadata[index]?.name || file.originalname,
          size: file.size,
          extension: extension,
          mimetype: file.mimetype,
          hash: hash
        };
      }));
    }

    switch (type) {
      case 'system-design':
        newContribution = new SystemDesignContribution({
          ...commonData,
          files: processedFiles
        });
        break;
      case 'dsa':
        newContribution = new DSAContribution(commonData);
        break;
      case 'c-output':
        newContribution = new COutputContribution(commonData);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid contribution type' });
    }

    await newContribution.save();
    res.status(201).json({ success: true, message: 'Contribution submitted successfully' });
  } catch (error) {
    console.error('Contribution error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit contribution', error: error.message });
  }
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

/**
 * ADMIN: GET PENDING CONTRIBUTIONS
 */
app.get('/admin/contributions/pending', protectAdmin, async (req, res) => {
  try {
    const systemDesign = await SystemDesignContribution.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    const dsa = await DSAContribution.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    const cOutput = await COutputContribution.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();

    const allPending = [
      ...systemDesign.map(c => ({ ...c, type: 'system-design' })),
      ...dsa.map(c => ({ ...c, type: 'dsa' })),
      ...cOutput.map(c => ({ ...c, type: 'c-output' }))
    ];

    // Sort combined results by date
    allPending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allPending);
  } catch (error) {
    console.error('Error fetching pending contributions:', error);
    res.status(500).json({ message: 'Server error fetching contributions' });
  }
});

/**
 * ADMIN: UPDATE CONTRIBUTION STATUS
 */
app.put('/admin/contributions/:id/status', protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, type } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    let Model;
    switch (type) {
      case 'system-design':
        Model = SystemDesignContribution;
        break;
      case 'dsa':
        Model = DSAContribution;
        break;
      case 'c-output':
        Model = COutputContribution;
        break;
      default:
        return res.status(400).json({ message: 'Invalid contribution type' });
    }

    const updatedContribution = await Model.findByIdAndUpdate(id, { status }, { new: true });

    if (!updatedContribution) {
      return res.status(404).json({ message: 'Contribution not found' });
    }

    res.json({ success: true, message: `Contribution ${status}`, data: updatedContribution });
  } catch (error) {
    console.error('Error updating contribution status:', error);
    res.status(500).json({ message: 'Server error updating contribution' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
