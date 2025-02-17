const mongoose = require("mongoose");

const fancy = new mongoose.Schema(
  {
    runnerName: { type: String, required: true },
    match_id: { type: String, required: true },
    selection_id: { type: String, required: true },
    team1: { type: String, required: true },
    team2: { type: String, required: true },
    layPrice: { type: String, required: true },
    backPrice: { type: String, required: true },
    match_result: { type: String, default: "undeclared" },
    fancy_result: { type: String, default: "undeclared" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fancy", fancy);
