const mongoose = require("mongoose");

const CreditTransactions = new mongoose.Schema(
  {
    user_id: { type: String, require: true },
    date: { type: String },
    debit: { type: String },
    credit: { type: String },
    description: { type: String },
    balance: { type: String },
    withdrawn_by: { type: String },
    deposited_by: { type: String },
    remark: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditTransaction", CreditTransactions);
