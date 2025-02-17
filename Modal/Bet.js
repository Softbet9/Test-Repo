const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, require: true },
    bet_amount: { type: String, required: true },
    bet_rate: { type: String, require: true },
    bet_on: { type: String, required: true },
    opponent_team: { type: String, required: true },
    bet_type: { type: String, required: true },
    position: { type: Object, required: true },
    market_id: { type: String, required: true },
    match_id: { type: String, required: true },
    user_id: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
