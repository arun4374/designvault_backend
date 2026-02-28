require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Import Models
const SystemDesignContribution = require('./Schema_Model/SystemDesignContribution');
const DSAContribution = require('./Schema_Model/DSAContribution');
const COutputContribution = require('./Schema_Model/COutputContribution');

// Connect to DB
const connectDB = async () => {
  try {
    // Ensure you have MONGO_URI in your .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed', err);
    process.exit(1);
  }
};

const generateSlug = (title) => {
  const slugBase = title
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    : 'post';
  return `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;
};

const backfillCollection = async (Model, name) => {
  console.log(`Checking ${name}...`);
  
  // Find documents where slug is missing, null, or empty
  const docs = await Model.find({
    $or: [
      { slug: { $exists: false } },
      { slug: null },
      { slug: '' }
    ]
  });

  if (docs.length === 0) {
    console.log(`No documents to backfill in ${name}.`);
    return;
  }

  console.log(`Found ${docs.length} documents in ${name} missing slugs. Updating...`);

  let count = 0;
  for (const doc of docs) {
    const slug = generateSlug(doc.title);
    
    // Use updateOne to bypass schema validation during migration if needed
    await Model.updateOne(
      { _id: doc._id },
      { $set: { slug: slug } }
    );
    count++;
    process.stdout.write(`\rUpdated ${count}/${docs.length}`);
  }
  console.log(`\nFinished ${name}.\n`);
};

const run = async () => {
  await connectDB();

  await backfillCollection(SystemDesignContribution, 'SystemDesignContribution');
  await backfillCollection(DSAContribution, 'DSAContribution');
  await backfillCollection(COutputContribution, 'COutputContribution');

  console.log('Backfill complete.');
  process.exit(0);
};

run();
