const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: String,
  level: Number,
  wrongAnswer: String,
  timeStamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('logs', logSchema);