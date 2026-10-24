const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");

    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 15000,
        autoSelectFamily: false,
      }
    );

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );

    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error);
    throw error;
  }
};

module.exports = connectDatabase;