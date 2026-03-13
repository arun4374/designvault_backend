const mongoose = require('mongoose');

/*************************************************
 * MONGOOSE SETTINGS
 *
 * bufferCommands: false — By default Mongoose buffers
 * DB operations if the connection drops, and silently
 * replays them when reconnected. This hides failures
 * from your app and can cause delayed, confusing bugs.
 * With this off, operations fail immediately and loudly
 * if the DB is down, so you get clear errors fast.
 *************************************************/
mongoose.set('bufferCommands', false);

/*************************************************
 * CONNECTION EVENTS
 * Logs connection lifecycle so you can see in your
 * server logs exactly when DB goes down or recovers.
 * Mongoose auto-reconnects on disconnect — these
 * events just make that visible.
 *************************************************/
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

/*************************************************
 * CONNECT
 *************************************************/
async function connectDB() {

  // Safety check — fail early with a clear message if
  // the env var is missing, instead of a cryptic mongoose error
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,  // fail fast if DB unreachable (5s)
      socketTimeoutMS: 45000,          // close idle sockets after 45s
      maxPoolSize: 10                  // max 10 concurrent DB connections
    });
  } catch (err) {
    console.error('❌ MongoDB initial connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
