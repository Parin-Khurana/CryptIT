const mongoose = require('mongoose');

async function connectMongoose() {
  try {
    await mongoose.connect(
      ''// add your MongoDB URI here
    );
    console.log("Mongoose connected successfully");
  } catch (err) {
    console.error("Mongoose connection error:", err);
  }
}

module.exports = connectMongoose;
