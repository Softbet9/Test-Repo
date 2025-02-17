const mongoose = require("mongoose");

const game = new mongoose.Schema({
  gName: { type: String },
  gId: { type: Number},
  block: { type: Boolean},
});

module.exports = mongoose.model("Game", game);
