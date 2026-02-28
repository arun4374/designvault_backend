/*************************************************
 * server.js - Secure & Production Ready Backend
 *************************************************/

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./db');

const User = require('./User');
const authController = require('./authController');

const SystemDesignContribution =
  require('./Schema_Model/SystemDesignContribution');

const DSAContribution =
  require('./Schema_Model/DSAContribution');

const COutputContribution =
  require('./Schema_Model/COutputContribution');

const {
  protect,
  protectAdmin
} = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

/*************************************************
 * DATABASE
 *************************************************/
connectDB();

/*************************************************
 * SECURITY MIDDLEWARE
 *************************************************/

// HTTP Headers Protection
app.use(helmet());

// Rate Limit (Anti DDOS)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
  })
);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id'
    ]
  })
);

app.options('*', cors());


/*************************************************
 * BODY PARSER
 *************************************************/
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/*************************************************
 * STATIC FILES
 *************************************************/
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

/*************************************************
 * MULTER CONFIG (CODE FILES ONLY)
 *************************************************/

const uploadDir = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

// Allowed Extensions
const allowedExt = [
  '.txt',
  '.java',
  '.c',
  '.cpp',
  '.py'
];

// Allowed MIME Types
const allowedMime = [
  'text/plain',
  'text/x-java-source',
  'text/x-c',
  'text/x-c++',
  'text/x-python'
];

// Storage
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const unique =
      Date.now() +
      '-' +
      crypto.randomBytes(6).toString('hex');

    cb(null, unique + path.extname(file.originalname));
  }
});

// Filter (IMPORTANT)
const fileFilter = (req, file, cb) => {

  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedExt.includes(ext) &&
    allowedMime.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only .txt, .java, .c, .cpp, .py files allowed'
      ),
      false
    );
  }
};

// Upload Instance
const upload = multer({

  storage,

  limits: {
    fileSize: 300 * 1024, // 300KB
    files: 5
  },

  fileFilter
});


/*************************************************
 * AUTH ROUTES
 *************************************************/

app.get(
  '/auth/google',
  authController.initiateGoogleLogin
);

app.get(
  '/auth/google/callback',
  authController.handleGoogleCallback
);

/*************************************************
 * USER ROUTES
 *************************************************/

// Get User Role
app.post(
  '/api/users/role',
  protect,
  (req, res) => {

    res.json({
      role: req.user.role
    });
  }
);

/*************************************************
 * CONTRIBUTION ROUTE
 *************************************************/

app.post(
  '/api/contributions',

  protect, // Session / Google auth

  upload.array('files', 5),

  async (req, res) => {

    try {

      if (!req.user) {
        return res
          .status(401)
          .json({ message: 'Login required' });
      }

      const {
        type,
        fileMetadata,
        ...data
      } = req.body;

      const userId = req.user._id;

      // Generate unique slug
      const slugBase = data.title
        ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : 'post';
      const slug = `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;

      const commonData = {

        ...data,

        userId,

        authorName: req.user.name,

        status: 'pending',

        slug
      };

      /******** PROCESS FILES ********/

      let processedFiles = [];

      if (req.files?.length) {

        const metadata = fileMetadata
          ? JSON.parse(fileMetadata)
          : [];

        processedFiles = await Promise.all(

          req.files.map(async (file, i) => {

            const buffer =
              await fs.promises.readFile(file.path);

            const hash = crypto
              .createHash('sha256')
              .update(buffer)
              .digest('hex');

            return {

              originalName: file.originalname,

              filename: file.filename,

              path: file.path,

              description:
                metadata[i]?.name ||
                file.originalname,

              size: file.size,

              extension:
                path.extname(file.originalname),

              mimetype: file.mimetype,

              hash
            };
          })
        );
      }

      /******** SAVE ********/

      let newContribution;

      switch (type) {

        case 'system-design':

          newContribution =
            new SystemDesignContribution({
              ...commonData,
              files: processedFiles
            });

          break;

        case 'dsa':

          newContribution =
            new DSAContribution(commonData);

          break;

        case 'c-output':

          newContribution =
            new COutputContribution(commonData);

          break;

        default:

          return res
            .status(400)
            .json({ message: 'Invalid type' });
      }

      await newContribution.save();

      res.status(201).json({

        success: true,

        message: 'Code uploaded successfully',

        slug: newContribution.slug
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({

        success: false,

        message: err.message
      });
    }
  }
);


/*************************************************
 * ADMIN ROUTES
 *************************************************/

// Get All Users
app.get(
  '/admin/users',
  protectAdmin,

  async (req, res) => {

    const users =
      await User.find()
        .sort({ createdAt: -1 })
        .lean();

    res.json(users);
  }
);

// Delete User
app.delete(
  '/admin/users/:id',
  protectAdmin,

  async (req, res) => {

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted' });
  }
);

// Get Pending Contributions
app.get(
  '/admin/contributions/pending',
  protectAdmin,

  async (req, res) => {

    const system =
      await SystemDesignContribution.find({
        status: 'pending'
      }).lean();

    const dsa =
      await DSAContribution.find({
        status: 'pending'
      }).lean();

    const coutput =
      await COutputContribution.find({
        status: 'pending'
      }).lean();

    const all = [

      ...system.map(c => ({
        ...c,
        type: 'system-design'
      })),

      ...dsa.map(c => ({
        ...c,
        type: 'dsa'
      })),

      ...coutput.map(c => ({
        ...c,
        type: 'c-output'
      }))
    ];

    all.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    res.json(all);
  }
);

// Update Status
app.put(
  '/admin/contributions/:id/status',
  protectAdmin,

  async (req, res) => {

    const { status, type } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Invalid status' });
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
        return res
          .status(400)
          .json({ message: 'Invalid type' });
    }

    const updated =
      await Model.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

    if (!updated) {
      return res
        .status(404)
        .json({ message: 'Not found' });
    }

    res.json({
      success: true,
      data: updated
    });
  }
);

/*************************************************
 * ERROR HANDLER
 *************************************************/

app.use((err, req, res, next) => {

  if (err instanceof multer.MulterError) {

    return res.status(400).json({
      message: err.message
    });
  }

  if (err) {

    return res.status(400).json({
      message: err.message
    });
  }

  next();
});

app.use(
  cors({
    origin: (origin, callback) => {

      const allowedOrigins = [
        'https://algoflow-sand.vercel.app',
        'http://localhost:5173'
      ];

      // Allow requests with no origin (mobile apps, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new Error('Not allowed by CORS')
        );
      }
    },

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'DELETE'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id'
    ]
  })
);


/*************************************************
 * SERVER
 *************************************************/

app.listen(PORT, () => {

  console.log(`🚀 Server running on ${PORT}`);
});
