require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const SystemDesignContribution = require('./Schema_Model/SystemDesignContribution');
const DSAContribution = require('./Schema_Model/DSAContribution');
const COutputContribution = require('./Schema_Model/COutputContribution');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
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
  console.log(`\nChecking ${name}...`);

  // FIX: Wrapped in try/catch so one failing collection
  //      doesn't crash the whole script mid-run.
  try {
    const docs = await Model.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).lean(); // .lean() for faster reads — we only need _id and title

    if (docs.length === 0) {
      console.log(`  ✅ No documents to backfill in ${name}.`);
      return;
    }

    console.log(`  Found ${docs.length} documents missing slugs. Updating...`);

    // FIX: Use bulkWrite instead of a sequential for loop with await.
    //      The old approach sent one DB request per document —
    //      bulkWrite sends them all in a single round trip,
    //      which is dramatically faster on large collections.
    const operations = docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { slug: generateSlug(doc.title) } }
      }
    }));

    const result = await Model.bulkWrite(operations, { ordered: false });
    // ordered:false means all ops run even if one fails,
    // giving us maximum coverage in a migration context.

    console.log(`  ✅ Finished ${name}: ${result.modifiedCount} updated.`);

  } catch (err) {
    // FIX: Log and continue instead of crashing — lets other
    //      collections still get processed.
    console.error(`  ❌ Error backfilling ${name}:`, err.message);
  }
};

const run = async () => {
  await connectDB();

  await backfillCollection(SystemDesignContribution, 'SystemDesignContribution');
  await backfillCollection(DSAContribution, 'DSAContribution');
  await backfillCollection(COutputContribution, 'COutputContribution');

  console.log('\n✅ All backfills complete.');

  // FIX: Always close the connection cleanly when done.
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed.');
};

// FIX: Catch any unexpected top-level errors with a clear message.
run().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
