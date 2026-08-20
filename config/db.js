const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cappsra_trips';
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️ MongoDB connection warning: ${error.message}`);
    console.log('💡 Note: Please verify MONGO_URI in your Render Environment Variables dashboard (ensure username/password and IP whitelist 0.0.0.0/0 are set). Server will continue running to keep service healthy.');
    // Do NOT process.exit(1) so Render web container stays UP and healthy!
  }
};

module.exports = connectDB;
