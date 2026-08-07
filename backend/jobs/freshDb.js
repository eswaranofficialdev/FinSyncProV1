require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const freshDatabase = async () => {
  try {
    await connectDB();

    console.log("Dropping database...");

    await mongoose.connection.dropDatabase();

    console.log("Database cleared successfully");

    process.exit(0);
  } catch (error) {
    console.error("Fresh DB Error:", error.message);
    process.exit(1);
  }
};

freshDatabase();