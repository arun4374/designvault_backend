require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  console.log('Backfilling credits for existing users...');

  try {
    // FIX: Also catch users where credits exists but is null,
    //      not just where the field is completely absent.
    const result = await User.updateMany(
      {
        $or: [
          { credits: { $exists: false } },
          { credits: null }
        ]
      },
      { $set: { credits: 100 } }
    );

    console.log('✅ Backfill complete.');
    console.log(`   Matched : ${result.matchedCount}`);
    console.log(`   Updated : ${result.modifiedCount}`);

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exitCode = 1; // mark failure without throwing
  } finally {
    // FIX: Always close the DB connection cleanly,
    //      whether the update succeeded or failed.
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
};

run().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
