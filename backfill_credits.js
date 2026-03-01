require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed', err);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();

  console.log('Backfilling credits for existing users...');

  try {
    // Find users where 'credits' field does not exist and set it to 100
    const result = await User.updateMany(
      { credits: { $exists: false } },
      { $set: { credits: 100 } }
    );

    console.log(`✅ Backfill complete.`);
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Updated: ${result.modifiedCount}`);

  } catch (error) {
    console.error('❌ Error during backfill:', error);
  }

  process.exit(0);
};

run();