const mongoose = require("mongoose");

const matchLogSchema = new mongoose.Schema(
  {
    match_gain: { type: String },
    match_title: { type: String },
    last_odds_transaction_id: { type: String },
    last_fancy_transaction_id: { type: String },
    last_bookmaker_transaction_id: { type: String },
    amount_added: { type: Number },
    match_result: { type: String, default: "undeclared" },
    odds_winnings: { type: Number },
    book_maker_winnings: { type: Number },
    fancy_winnings: { type: Number },
    match_winner: { type: String },
    match_loser: { type: String },
    match_id: { type: String, required: true },
    user_id: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Matchlog", matchLogSchema);
