const mongoose = require("mongoose");

const match = new mongoose.Schema(
  {
    match_id: { type: String, unique: true, required: true },
    status: { type: String, default: "undeclared" },
    winner: { type: String },
    loser: { type: String },
    result: { type: Number, default: 0 },
    team1: { type: String, required: true },
    team2: { type: String, required: true },
    type: { type: String, default: "cricket" },
    match_name: { type: String, required: true },
    matchObj: { type: Object },
    start_time: { type: Date },
    runners: { type: Object },
    is_block: { type: Boolean, default: false },
  },
  { collection: "matches" }
);

module.exports = mongoose.model("Match", match);
