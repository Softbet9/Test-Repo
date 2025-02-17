const mongoose = require("mongoose");

const fancyTransactionSchema = new mongoose.Schema(
  {
    bet_amount: { type: String, required: true },
    bet_rate: { type: String, require: true },
    team1: { type: String, required: true },
    team2: { type: String, required: true },
    bet_type: { type: String, required: true },
    market_id: { type: String, required: true },
    match_id: { type: String, required: true },
    user_id: { type: String, required: true },
    selection_id: { type: String, required: true },
    fancy_Detail: { type: Object, required: true },
    fancy_result: { type: String, default: "undeclared" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FancyTransaction", fancyTransactionSchema);
