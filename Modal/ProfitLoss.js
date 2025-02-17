const mongoose = require("mongoose");

const ProfitAndLoss = new mongoose.Schema(
  {
    user_id: { type: String, require: true },
    profit_loss_ledger: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("profit-loss-ledger", ProfitAndLoss);
